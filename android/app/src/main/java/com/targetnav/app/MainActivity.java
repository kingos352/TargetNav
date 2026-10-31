package com.targetnav.app;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.content.SharedPreferences;
import android.media.AudioManager;
import android.media.ToneGenerator;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.os.VibratorManager;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.net.Uri;
import android.os.Bundle;
import android.util.Base64;
import android.webkit.*;
import android.view.View;
import android.view.WindowManager;
import android.widget.Toast;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import org.json.JSONObject;

/** Offline-bundled TargetNav shell. No Google Play Services dependencies. */
public final class MainActivity extends Activity implements LocationListener {
    private static final String HOST="appassets.androidplatform.net";
    private static final String START="https://"+HOST+"/assets/www/index.html";
    private WebView web;
    private LocationManager locations;
    private ValueCallback<Uri[]> picker;
    private byte[] exportBytes;
    private boolean locationRequested=false, foreground=true;
    private volatile boolean serviceRunning=false;
    private SharedPreferences prefs;
    private static final int PICK=101, SAVE=102, LOC=103, NOTIFY=104;

    @Override public void onCreate(Bundle saved) {
        super.onCreate(saved);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        prefs=getSharedPreferences("targetnav",MODE_PRIVATE);
        web=new WebView(this);
        // Arka planda (Balloon Live açıkken) da sayfa betikleri konumu işlemeye devam etsin.
        web.setRendererPriorityPolicy(WebView.RENDERER_PRIORITY_IMPORTANT,false);
        web.setBackgroundColor(Color.rgb(24,25,27));
        setContentView(web);
        // Android 15 edge-to-edge: keep the map and dialogs out of system bars/keyboard.
        web.setOnApplyWindowInsetsListener((v,insets)->{
            if(android.os.Build.VERSION.SDK_INT>=30){
                android.graphics.Insets i=insets.getInsets(android.view.WindowInsets.Type.systemBars()|android.view.WindowInsets.Type.ime());
                v.setPadding(i.left,i.top,i.right,i.bottom);
            } else v.setPadding(insets.getSystemWindowInsetLeft(),insets.getSystemWindowInsetTop(),insets.getSystemWindowInsetRight(),insets.getSystemWindowInsetBottom());
            return insets;
        });
        locations=(LocationManager)getSystemService(LOCATION_SERVICE);
        WebSettings settings=web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setGeolocationEnabled(false); // GPS is supplied directly by Android LocationManager.
        settings.setSupportMultipleWindows(false);
        CookieManager.getInstance().setAcceptThirdPartyCookies(web,false);
        web.addJavascriptInterface(new NativeBridge(),"TargetNavAndroid");
        web.setWebViewClient(new WebViewClient(){
            @Override public WebResourceResponse shouldInterceptRequest(WebView view,WebResourceRequest request){return asset(request.getUrl());}
            @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request){
                Uri u=request.getUrl();
                if(trusted(u))return false;
                if(request.isForMainFrame()&&"https".equals(u.getScheme())){
                    try{startActivity(new Intent(Intent.ACTION_VIEW,u));}catch(Exception e){message("Bağlantıyı açabilecek tarayıcı yok.");}
                }
                return true;
            }
        });
        web.setWebChromeClient(new WebChromeClient(){
            @Override public boolean onShowFileChooser(WebView view,ValueCallback<Uri[]> result,FileChooserParams params){
                if(picker!=null)picker.onReceiveValue(null);
                picker=result;
                Intent intent=new Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("*/*");
                intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE,params.getMode()==FileChooserParams.MODE_OPEN_MULTIPLE);
                try{startActivityForResult(intent,PICK);}catch(Exception e){picker.onReceiveValue(null);picker=null;message("Dosya seçici açılamadı.");}
                return true;
            }
        });
        web.loadUrl(START);
    }
    private static boolean trusted(Uri u){return "https".equals(u.getScheme())&&HOST.equals(u.getHost())&&(u.getPort()==-1||u.getPort()==443);}
    private WebResourceResponse asset(Uri u){
        if(!trusted(u))return null;
        String path=u.getPath();
        if(path==null||!path.startsWith("/assets/www/")||path.contains("..")||path.contains("\\"))return missing();
        String relative=path.substring("/assets/".length());
        try{
            String ext=android.webkit.MimeTypeMap.getFileExtensionFromUrl(path);
            String mime=android.webkit.MimeTypeMap.getSingleton().getMimeTypeFromExtension(ext);
            if(path.endsWith(".mjs")||path.endsWith(".js"))mime="application/javascript";
            if(path.endsWith(".wasm"))mime="application/wasm";
            if(path.endsWith(".json")||path.endsWith(".webmanifest"))mime="application/json";
            if(mime==null)mime="application/octet-stream";
            Map<String,String> headers=new HashMap<>();headers.put("Cache-Control","no-store");headers.put("X-Content-Type-Options","nosniff");
            return new WebResourceResponse(mime,"UTF-8",200,"OK",headers,getAssets().open(relative));
        }catch(IOException e){return missing();}
    }
    private static WebResourceResponse missing(){return new WebResourceResponse("text/plain","UTF-8",404,"Not Found",Collections.emptyMap(),new ByteArrayInputStream(new byte[0]));}
    private boolean locationAllowed(){return checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION)==PackageManager.PERMISSION_GRANTED||checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION)==PackageManager.PERMISSION_GRANTED;}
    private void startLocation(){
        if(!locationRequested||(!foreground&&!serviceRunning))return;
        if(!locationAllowed()){requestPermissions(new String[]{Manifest.permission.ACCESS_FINE_LOCATION,Manifest.permission.ACCESS_COARSE_LOCATION},LOC);return;}
        try{
            locations.removeUpdates(this);
            boolean any=false;
            for(String provider:new String[]{LocationManager.GPS_PROVIDER,LocationManager.NETWORK_PROVIDER}){
                if(provider.equals(LocationManager.GPS_PROVIDER)&&checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION)!=PackageManager.PERMISSION_GRANTED)continue;
                if(locations.isProviderEnabled(provider)){locations.requestLocationUpdates(provider,1000L,0f,this);any=true;}
            }
            if(!any)geoError(2,"Cihaz konumunu / GPS'i açın.");
            else startBackgroundService();
        }catch(SecurityException e){geoError(1,"Konum izni gerekli.");}catch(Exception e){geoError(2,"Konum sağlayıcısı kullanılamıyor.");}
    }
    private void stopLocation(){if(locations!=null)locations.removeUpdates(this);stopBackgroundService();}
    private boolean backgroundEnabled(){return prefs.getBoolean("background",true);}
    private void startBackgroundService(){
        if(!backgroundEnabled()||serviceRunning||!locationAllowed())return;
        if(Build.VERSION.SDK_INT>=33&&!prefs.getBoolean("notifyAsked",false)&&checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED){prefs.edit().putBoolean("notifyAsked",true).apply();requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS},NOTIFY);}
        try{startForegroundService(new Intent(this,LocationService.class));serviceRunning=true;}catch(Exception e){message("Arka plan konumu başlatılamadı; uygulama açıkken GPS çalışır.");}
    }
    private void stopBackgroundService(){if(serviceRunning){stopService(new Intent(this,LocationService.class));serviceRunning=false;}}
    private void alert(int level,boolean sound){
        try{
            Vibrator v=Build.VERSION.SDK_INT>=31?((VibratorManager)getSystemService(VIBRATOR_MANAGER_SERVICE)).getDefaultVibrator():(Vibrator)getSystemService(VIBRATOR_SERVICE);
            if(v!=null&&v.hasVibrator())v.vibrate(VibrationEffect.createWaveform(level>=2?new long[]{0,180,120,180}:new long[]{0,140},-1));
        }catch(Exception ignored){}
        if(!sound)return;
        try{
            ToneGenerator tone=new ToneGenerator(AudioManager.STREAM_NOTIFICATION,55);
            tone.startTone(level>=2?ToneGenerator.TONE_PROP_BEEP2:ToneGenerator.TONE_PROP_BEEP,220);
            new Handler(Looper.getMainLooper()).postDelayed(tone::release,700);
        }catch(Exception ignored){}
    }
    private void js(String code){if(web!=null&&trusted(Uri.parse(web.getUrl()==null?START:web.getUrl())))web.evaluateJavascript(code,null);}
    private void geoError(int code,String text){js("window.TargetNavNative&&window.TargetNavNative.error("+code+","+JSONObject.quote(text)+")");}
    @Override public void onLocationChanged(Location l){
        try{
            JSONObject c=new JSONObject();c.put("latitude",l.getLatitude());c.put("longitude",l.getLongitude());c.put("accuracy",l.hasAccuracy()?l.getAccuracy():9999);
            c.put("altitude",l.hasAltitude()?l.getAltitude():JSONObject.NULL);c.put("altitudeAccuracy",l.hasVerticalAccuracy()?l.getVerticalAccuracyMeters():JSONObject.NULL);
            c.put("speed",l.hasSpeed()?l.getSpeed():JSONObject.NULL);c.put("heading",l.hasBearing()?l.getBearing():JSONObject.NULL);
            JSONObject p=new JSONObject();p.put("coords",c);p.put("timestamp",l.getTime());js("window.TargetNavNative&&window.TargetNavNative.position("+p.toString()+")");
        }catch(Exception e){geoError(2,"Konum verisi işlenemedi.");}
    }
    @Override public void onProviderDisabled(String provider){if(locationRequested)startLocation();}
    @Override public void onProviderEnabled(String provider){if(locationRequested)startLocation();}
    @Override public void onStatusChanged(String provider,int status,Bundle extras){}
    @Override public void onRequestPermissionsResult(int request,String[] permissions,int[] grants){super.onRequestPermissionsResult(request,permissions,grants);if(request==LOC){if(locationAllowed())startLocation();else geoError(1,"Konum izni verilmedi.");}}
    public final class NativeBridge {
        @JavascriptInterface public void startGPS(){runOnUiThread(()->{locationRequested=true;startLocation();});}
        @JavascriptInterface public void stopGPS(){runOnUiThread(()->{locationRequested=false;stopLocation();});}
        @JavascriptInterface public boolean getBackground(){return backgroundEnabled();}
        @JavascriptInterface public boolean isBackgroundActive(){return serviceRunning;}
        @JavascriptInterface public void setBackground(boolean on){prefs.edit().putBoolean("background",on).apply();runOnUiThread(()->{if(on){if(locationRequested)startBackgroundService();}else stopBackgroundService();});}
        @JavascriptInterface public void alertPZ(int level,boolean sound){runOnUiThread(()->alert(level,sound));}
        @JavascriptInterface public void saveFile(String name,String mime,String base64){
            // Export only into the user-selected document; never arbitrary filesystem paths.
            if(base64==null||base64.length()>56000000){runOnUiThread(()->message("Dosya dışa aktarım sınırını aşıyor."));return;}
            final byte[] bytes;
            try{bytes=Base64.decode(base64,Base64.DEFAULT);}catch(Exception e){return;}
            runOnUiThread(()->{
                if(exportBytes!=null){message("Önce açık dosya kaydetme işlemini tamamlayın.");return;}
                exportBytes=bytes;
                Intent intent=new Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType(mime!=null&&mime.contains("/")?mime:"application/octet-stream");
                intent.putExtra(Intent.EXTRA_TITLE,name==null?"targetnav-export":name.replaceAll("[\\\\/\\p{Cntrl}]","_"));
                try{startActivityForResult(intent,SAVE);}catch(Exception e){exportBytes=null;message("Dosya kaydetme penceresi açılamadı.");}
            });
        }
    }
    @Override protected void onActivityResult(int request,int result,Intent data){
        super.onActivityResult(request,result,data);
        if(request==PICK&&picker!=null){Uri[] selected=null;if(result==RESULT_OK&&data!=null){if(data.getClipData()!=null){int count=data.getClipData().getItemCount();selected=new Uri[count];for(int i=0;i<count;i++)selected[i]=data.getClipData().getItemAt(i).getUri();}else if(data.getData()!=null)selected=new Uri[]{data.getData()};}picker.onReceiveValue(selected);picker=null;}
        if(request==SAVE){final byte[] bytes=exportBytes;exportBytes=null;if(result==RESULT_OK&&data!=null&&data.getData()!=null&&bytes!=null){Uri uri=data.getData();new Thread(()->{try(OutputStream out=getContentResolver().openOutputStream(uri)){if(out==null)throw new IOException();out.write(bytes);runOnUiThread(()->message("Dosya kaydedildi."));}catch(Exception e){runOnUiThread(()->message("Dosya kaydedilemedi."));}}).start();}}
    }
    private void message(String text){Toast.makeText(this,text,Toast.LENGTH_LONG).show();}
    @Override protected void onPause(){
        foreground=false;js("window.dispatchEvent(new Event('targetnavpause'));window.dispatchEvent(new Event('pagehide'));");
        // Arka plan servisi açıksa GPS ve WebView çalışmaya devam eder; değilse eskisi gibi durur.
        if(!(locationRequested&&serviceRunning)){stopLocation();web.onPause();}
        super.onPause();
    }
    @Override protected void onResume(){super.onResume();foreground=true;if(web!=null){web.onResume();if(locationRequested)startLocation();}}
    @Override public void onBackPressed(){
        web.evaluateJavascript("(function(){const d=document.querySelector('dialog.action-confirm[open]')||document.querySelector('dialog[open]');if(d){d.close();return true;}const c=document.querySelector('#modeHint:not([hidden]) #cancelDrawing');if(c){c.click();return true;}return false;})()",value->{if(!"true".equals(value))new AlertDialog.Builder(this).setTitle("TargetNav").setMessage("Uygulamadan çıkılsın mı? Çıkarsanız GPS ve uçuş kaydı durur. Kayıt sürsün istiyorsanız Ana ekran tuşuyla geçin.").setNegativeButton("Vazgeç",null).setPositiveButton("Çık",(dialog,which)->finish()).show();});
    }
    @Override protected void onDestroy(){stopLocation();if(picker!=null)picker.onReceiveValue(null);if(web!=null){web.removeJavascriptInterface("TargetNavAndroid");web.destroy();}super.onDestroy();}
}
