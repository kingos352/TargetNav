let pending=false;
// Use an app-owned dialog: browser modal permissions vary across hosted frames and WebViews.
export function confirmAction(title,message,confirmLabel='Onayla'){
 if(pending)return Promise.resolve(false);
 pending=true;
 return new Promise(resolve=>{
  const dialog=document.createElement('dialog');dialog.className='action-confirm';dialog.setAttribute('aria-labelledby','action-confirm-title');
  dialog.innerHTML='<div class="dialog-heading"><h2 id="action-confirm-title"></h2><button type="button" class="iconbtn" aria-label="Vazgeç">×</button></div><div class="confirmation-body"><p class="hint"></p><div class="actions"><button type="button" class="secondary" data-cancel autofocus>Vazgeç</button><button type="button" class="primary" data-confirm></button></div></div>';
  dialog.querySelector('h2').textContent=title;dialog.querySelector('p').textContent=message;dialog.querySelector('[data-confirm]').textContent=confirmLabel;
  let settled=false;const finish=value=>{if(settled)return;settled=true;pending=false;if(dialog.open)dialog.close();dialog.remove();resolve(value);};
  dialog.querySelector('.iconbtn').onclick=()=>finish(false);dialog.querySelector('[data-cancel]').onclick=()=>finish(false);dialog.querySelector('[data-confirm]').onclick=()=>finish(true);dialog.oncancel=e=>{e.preventDefault();finish(false);};dialog.onclose=()=>finish(false);
  document.body.append(dialog);try{dialog.showModal();}catch(e){dialog.remove();pending=false;resolve(false);}
 });
}
