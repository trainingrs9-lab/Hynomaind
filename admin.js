const cfg=window.HYPNOMIND_CONFIG||{};
const statusNode=document.getElementById('admin-status');
const dashboardStatus=document.getElementById('dashboard-status');
let client=null;
const login=document.getElementById('login-form');
const dashboard=document.getElementById('dashboard');
const logout=document.getElementById('logout');

if(cfg.supabaseUrl&&!cfg.supabaseUrl.includes('YOUR-PROJECT')&&cfg.supabaseAnonKey&&!cfg.supabaseAnonKey.includes('YOUR_SUPABASE')){
  client=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey);
}else{
  statusNode.textContent='Setup required: add your Supabase URL and anon key in config.js.';
}

login.addEventListener('submit',async e=>{
  e.preventDefault();
  if(!client)return;
  statusNode.textContent='Signing in…';
  const {error}=await client.auth.signInWithPassword({
    email:document.getElementById('admin-email').value,
    password:document.getElementById('admin-password').value
  });
  if(error){statusNode.textContent=error.message;return;}
  login.classList.add('hidden');
  dashboard.classList.remove('hidden');
  logout.classList.remove('hidden');
  await loadEnquiries();
});

logout.addEventListener('click',async()=>{
  await client?.auth.signOut();
  login.classList.remove('hidden');
  dashboard.classList.add('hidden');
  logout.classList.add('hidden');
  dashboardStatus.textContent='';
});

document.getElementById('refresh').addEventListener('click',loadEnquiries);

async function loadEnquiries(){
  if(!client)return;
  dashboardStatus.textContent='Loading enquiries…';
  const {data,error}=await client.from('enquiries').select('*').order('created_at',{ascending:false});
  if(error){
    dashboardStatus.textContent='Could not load enquiries: '+error.message;
    return;
  }
  document.getElementById('count').textContent=`${data.length} ${data.length===1?'enquiry':'enquiries'}`;
  const body=document.getElementById('enquiry-rows');
  body.replaceChildren();
  for(const item of data){
    const tr=document.createElement('tr');
    const date=new Date(item.created_at).toLocaleString();
    const contact=[item.phone,item.email].filter(Boolean).join(' · ');
    const cells=[date,`${item.name}\n${contact}`,item.interest,item.message||''];
    cells.forEach(value=>{
      const td=document.createElement('td');
      td.textContent=value;
      td.style.whiteSpace='pre-line';
      tr.appendChild(td);
    });
    const td=document.createElement('td');
    const select=document.createElement('select');
    ['New','Contacted','Completed'].forEach(s=>{
      const op=document.createElement('option');
      op.value=s;
      op.textContent=s;
      op.selected=item.status===s;
      select.appendChild(op);
    });
    select.addEventListener('change',async()=>{
      const previousStatus=item.status||'New';
      const nextStatus=select.value;
      select.disabled=true;
      dashboardStatus.textContent='Saving status…';
      try{
        const {data:updated,error:updateError}=await client
          .from('enquiries')
          .update({status:nextStatus})
          .eq('id',item.id)
          .select('id,status')
          .single();
        if(updateError)throw updateError;
        if(!updated)throw new Error('No enquiry row was updated. Please check the admin database permission.');
        item.status=updated.status;
        select.value=updated.status;
        dashboardStatus.textContent='Status saved successfully.';
      }catch(err){
        select.value=previousStatus;
        dashboardStatus.textContent='Status could not be saved: '+(err.message||'Unknown error');
      }finally{
        select.disabled=false;
      }
    });
    td.appendChild(select);
    tr.appendChild(td);
    body.appendChild(tr);
  }
  if(data.length===0)dashboardStatus.textContent='No enquiries found yet.';
  else if(dashboardStatus.textContent==='Loading enquiries…')dashboardStatus.textContent='';
}
