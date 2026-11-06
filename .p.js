const {createClient}=require('@supabase/supabase-js');
const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
(async()=>{
const ids=[2026020251,2026020252,2026020253,2026020254,2026020255,2026020256,2026020257,2026020258,2026020259,2026020260,2026020261];
const r=await s.from('game_player_stats').select('game_id').in('game_id',ids);
const g=await s.from('games').select('game_state').in('id',ids);
console.log(new Date().toISOString().slice(11,19),'rows',r.data?.length,'states',g.data?.map(x=>x.game_state).join(','), r.error?.message||'');
})()
