package com.targetnav.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;

/** Keeps the app in the foreground while GPS is on, so location keeps flowing when the pilot switches to Balloon Live or locks the screen. */
public final class LocationService extends Service {
    private static final String CHANNEL="targetnav-location";
    private static final int NOTIFICATION=1;
    private static final long MAX_WAKE_MS=8L*60*60*1000;
    private PowerManager.WakeLock wake;

    @Override public void onCreate(){
        super.onCreate();
        NotificationChannel channel=new NotificationChannel(CHANNEL,"Konum kaydı",NotificationManager.IMPORTANCE_LOW);
        channel.setDescription("GPS açıkken uygulama arka planda da konum alır.");
        channel.setShowBadge(false);
        getSystemService(NotificationManager.class).createNotificationChannel(channel);
    }
    @Override public int onStartCommand(Intent intent,int flags,int startId){
        Intent open=new Intent(this,MainActivity.class).setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent tap=PendingIntent.getActivity(this,0,open,PendingIntent.FLAG_IMMUTABLE|PendingIntent.FLAG_UPDATE_CURRENT);
        Notification n=new Notification.Builder(this,CHANNEL)
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setContentTitle("TargetNav konum kaydı açık")
            .setContentText("GPS, rota ve rüzgâr ölçümü arka planda sürüyor. Kapatmak için GPS’i kapatın.")
            .setOngoing(true).setOnlyAlertOnce(true).setCategory(Notification.CATEGORY_NAVIGATION)
            .setContentIntent(tap).build();
        if(Build.VERSION.SDK_INT>=29)startForeground(NOTIFICATION,n,ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION);
        else startForeground(NOTIFICATION,n);
        if(wake==null){
            // Ekran kapalıyken konum geri çağrılarının ve WebView'in işlenmesi için CPU açık kalır; uçuş süresiyle sınırlı.
            wake=((PowerManager)getSystemService(POWER_SERVICE)).newWakeLock(PowerManager.PARTIAL_WAKE_LOCK,"TargetNav:gps");
            wake.setReferenceCounted(false);
            wake.acquire(MAX_WAKE_MS);
        }
        return START_NOT_STICKY;
    }
    @Override public void onDestroy(){
        if(wake!=null&&wake.isHeld())wake.release();
        wake=null;
        super.onDestroy();
    }
    @Override public IBinder onBind(Intent intent){return null;}
}
