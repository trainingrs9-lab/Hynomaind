const cfg=window.HYPNOMIND_CONFIG||{};
const statusNode=document.getElementById('admin-status');
const dashboardStatus=document.getElementById('dashboard-status');
let client=null;
let allEnquiries=[];
const login=document.getElementById('login-form');
const dashboard=document.getElementById('dashboard');
const logout=document.getElementById('logout');
const searchInput=document.getElementById('enquiry-search');
const interestFilter=document.getElementById('interest-filter');
const statusFilter=document.getElementById('status-filter');

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
searchInput.addEventListener('input',renderEnquiries);
interestFilter.addEventListener('change',renderEnquiries);
statusFilter.addEventListener('change',renderEnquiries);

async function loadEnquiries(){
  if(!client)return;
  dashboardStatus.textContent='Loading enquiries…';
  const {data,error}=await client.from('enquiries').select('*').order('created_at',{ascending:false});
  if(error){
    dashboardStatus.textContent='Could not load enquiries: '+error.message;
    return;
  }
  allEnquiries=data||[];
  document.getElementById('count').textContent=`${allEnquiries.length} ${allEnquiries.length===1?'enquiry':'enquiries'}`;
  const currentInterest=interestFilter.value;
  const interests=[...new Set(allEnquiries.map(x=>x.interest).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
  interestFilter.replaceChildren(new Option('All enquiry types',''));
  interests.forEach(value=>interestFilter.add(new Option(value,value)));
  if(interests.includes(currentInterest))interestFilter.value=currentInterest;
  renderEnquiries();
  if(allEnquiries.length===0)dashboardStatus.textContent='No enquiries found yet.';
  else dashboardStatus.textContent='';
}

function renderEnquiries(){
  const term=searchInput.value.trim().toLowerCase();
  const chosenInterest=interestFilter.value;
  const chosenStatus=statusFilter.value;
  const filtered=allEnquiries.filter(item=>{
    const searchable=[item.query_code,item.name,item.phone,item.email,item.interest,item.message,item.status].filter(Boolean).join(' ').toLowerCase();
    return (!term||searchable.includes(term))&&(!chosenInterest||item.interest===chosenInterest)&&(!chosenStatus||item.status===chosenStatus);
  });
  const body=document.getElementById('enquiry-rows');
  body.replaceChildren();
  filtered.forEach(item=>{
    const tr=document.createElement('tr');
    const code=document.createElement('td');
    code.className='query-code';
    code.textContent=item.query_code||'—';
    tr.appendChild(code);
    const date=document.createElement('td');
    date.textContent=new Date(item.created_at).toLocaleString();
    tr.appendChild(date);
    const contact=document.createElement('td');
    contact.textContent=[item.name,[item.phone,item.email].filter(Boolean).join(' · ')].filter(Boolean).join('\n');
    contact.style.whiteSpace='pre-line';
    tr.appendChild(contact);
    [item.interest||'',item.message||''].forEach(value=>{
      const td=document.createElement('td');
      td.textContent=value;
      td.style.whiteSpace='pre-line';
      tr.appendChild(td);
    });
    const statusCell=document.createElement('td');
    const select=document.createElement('select');
    ['New','Contacted','Completed'].forEach(s=>{
      const op=new Option(s,s);
      op.selected=(item.status||'New')===s;
      select.add(op);
    });
    select.addEventListener('change',async()=>{
      const previousStatus=item.status||'New';
      const nextStatus=select.value;
      select.disabled=true;
      dashboardStatus.textContent='Saving status…';
      try{
        const {data:updated,error:updateError}=await client.from('enquiries').update({status:nextStatus}).eq('id',item.id).select('id,status').single();
        if(updateError)throw updateError;
        if(!updated)throw new Error('No enquiry row was updated. Please check the admin database permission.');
        item.status=updated.status;
        select.value=updated.status;
        dashboardStatus.textContent='Status saved successfully.';
        renderEnquiries();
      }catch(err){
        select.value=previousStatus;
        dashboardStatus.textContent='Status could not be saved: '+(err.message||'Unknown error');
      }finally{
        select.disabled=false;
      }
    });
    statusCell.appendChild(select);
    tr.appendChild(statusCell);
    body.appendChild(tr);
  });
  if(filtered.length===0)dashboardStatus.textContent='No enquiries match your search or filters.';
}
