import './style.css';
import { DataAdapter } from './DataAdapter.js';
import Chart from 'chart.js/auto';
import { ENV } from './env.js';

  let authMode = 'signin';
  let trendChart = null, pieChart = null;

  function toast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.remove('hidden');
    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(() => el.classList.add('hidden'), 3200);
  }

  function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
  function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

  // ---------------- Auth modal ----------------
  function openAuthModal(role) {
    document.getElementById('authRole').value = role;
    document.getElementById('authRoleBanner').classList.toggle('hidden', role !== 'admin');
    document.getElementById('authInviteField').classList.toggle('hidden', role !== 'admin' || authMode !== 'signup');
    if (!DataAdapter.isBackendConnected) {
      const notice = document.getElementById('backendNotice');
      notice.textContent = '提示：未检测到 Supabase 连接，当前运行在本地演示模式（数据仅保存在本浏览器）。';
      notice.classList.remove('hidden');
    }
    // 管理员入口默认切到注册 tab，使邀请码字段自动可见；已有账号可手动切回登录
    if (role === 'admin') switchAuthTab('signup');
    openModal('authModal');
  }

  function switchAuthTab(tab) {
    authMode = tab;
    const isSignup = tab === 'signup';
    document.getElementById('tabSignin').className = isSignup ? 'text-ink-700/40 pb-2' : 'text-canopy-700 border-b-2 border-canopy-600 pb-2 -mb-[13px]';
    document.getElementById('tabSignup').className = isSignup ? 'text-canopy-700 border-b-2 border-canopy-600 pb-2 -mb-[13px]' : 'text-ink-700/40 pb-2';
    document.getElementById('authSignupFields').classList.toggle('hidden', !isSignup);
    document.getElementById('authInviteField').classList.toggle('hidden', !(isSignup && document.getElementById('authRole').value === 'admin'));
    document.getElementById('authSubmitBtn').textContent = isSignup ? '创建账号' : '登录';
  }

  async function handleAuthSubmit(e) {
    e.preventDefault();
    const role = document.getElementById('authRole').value;
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPassword').value;
    const nickname = document.getElementById('authNickname').value || '守护使者';
    const inviteCode = document.getElementById('authInviteCode').value;

    try {
      if (authMode === 'signup') {
        if (role === 'admin') {
          const codes = ENV.ADMIN_INVITE_CODES || [];
          if (!codes.includes(inviteCode)) {
            toast('邀请码无效，管理员账号仅限授权人员注册');
            return;
          }
        }
        await DataAdapter.signUp(email, password, role, { nickname });
        toast('注册成功，请登录');
        switchAuthTab('signin');
      } else {
        await DataAdapter.signIn(email, password);
        closeModal('authModal');
        toast('登录成功，欢迎回来');
        await refreshAll();
        const user = await DataAdapter.getCurrentUser();
        document.getElementById(user && user.role === 'admin' ? 'dashboard' : 'action').scrollIntoView({ behavior: 'smooth' });
      }
    } catch (err) {
      toast('操作失败：' + (err && err.message ? err.message : '未知错误'));
    }
  }

  async function handleSignOut() {
    await DataAdapter.signOut();
    toast('已安全退出');
    await refreshAll();
  }

  // ---------------- Observation modal ----------------
  async function openObsModal() {
    const user = await DataAdapter.getCurrentUser();
    if (!user) { toast('请先登录后再提交观测'); openAuthModal('public'); return; }
    const species = await DataAdapter.getSpecies();
    document.getElementById('obsSpecies').innerHTML = species.map(s => `<option value="${s.id}">${s.commonName}（${s.scientificName}）</option>`).join('');
    openModal('obsModal');
  }

  async function handleObsSubmit(e) {
    e.preventDefault();
    const data = {
      speciesId: document.getElementById('obsSpecies').value,
      individualCount: document.getElementById('obsCount').value,
      decimalLatitude: document.getElementById('obsLat').value,
      decimalLongitude: document.getElementById('obsLng').value,
      note: document.getElementById('obsNote').value
    };
    try {
      await DataAdapter.submitObservation(data);
      closeModal('obsModal');
      toast('提交成功，已进入审核队列 · +待发放 100 pt');
      await refreshAll();
    } catch (err) {
      toast('提交失败：' + err.message);
    }
  }

  // ---------------- Report modal ----------------
  function openReportModal() { openModal('reportModal'); }

  async function handleReportSubmit(e) {
    e.preventDefault();
    const data = {
      type: document.getElementById('reportType').value,
      location: document.getElementById('reportLocation').value,
      description: document.getElementById('reportDesc').value
    };
    try {
      await DataAdapter.submitReport(data);
      closeModal('reportModal');
      toast('事件已上报，管理端将尽快响应');
      await refreshAll();
    } catch (err) {
      toast('提交失败：' + err.message);
    }
  }

  function selectGuardian(id) {
    if (!id) return;
    toast('守护契约已缔结，围绕该物种的观测将获得额外成长加成');
  }

  // ---------------- Rendering ----------------
  async function renderSpeciesGallery() {
    const species = await DataAdapter.getSpecies();
    const wrap = document.getElementById('speciesGallery');
    wrap.innerHTML = species.map((sp, i) => `
      <div class="glass rounded-3xl overflow-hidden shadow-sm min-w-[260px] max-w-[260px] snap-start flex flex-col hover:-translate-y-1 transition-transform duration-300 fade-up" style="animation-delay: ${i * 30}ms;">
        <div class="h-36 relative overflow-hidden">
          <img src="${sp.imageUrl}" class="w-full h-full object-cover" alt="${sp.commonName}">
          <span class="absolute top-3 left-3 stamp text-[9px] font-mono font-semibold px-3 py-1 bg-ink-900/70 text-white backdrop-blur-sm">${sp.conservationStatus}</span>
        </div>
        <div class="p-4 flex-1 flex flex-col">
          <h4 class="font-display text-base text-ink-800">${sp.commonName}</h4>
          <p class="text-[10px] italic text-ink-700/45 font-mono">${sp.scientificName}</p>
          <p class="text-[11.5px] text-ink-700/65 mt-2 leading-relaxed flex-1">${sp.description}</p>
          <p class="text-[10px] text-canopy-700 font-medium mt-3 border-t hairline pt-2.5"><i class="fa-solid fa-leaf mr-1"></i>${sp.habitat}</p>
        </div>
      </div>
    `).join('');

    const select = document.getElementById('guardianSelect');
    select.innerHTML = '<option value="">选择我的守护物种…</option>' + species.map(s => `<option value="${s.id}">${s.commonName}（${s.conservationStatus}）</option>`).join('');
  }

  async function renderNav() {
    const user = await DataAdapter.getCurrentUser();
    const pill = document.getElementById('navUserPill');
    const authBtn = document.getElementById('navAuthBtn');
    if (user) {
      pill.classList.remove('hidden');
      document.getElementById('navUserName').textContent = user.nickname || '守护使者';
      document.getElementById('navUserPoints').textContent = `${user.points || 0} pt`;
      authBtn.textContent = '退出登录';
      authBtn.onclick = handleSignOut;
    } else {
      pill.classList.add('hidden');
      authBtn.textContent = '注册 / 登录';
      authBtn.onclick = () => openAuthModal('public');
    }
  }

  async function renderProfile() {
    const user = await DataAdapter.getCurrentUser();
    document.getElementById('profileNameDisplay').textContent = user ? `${user.nickname} 的守护档案` : '我的守护档案（未登录）';
    document.getElementById('profileLevel').textContent = user ? (user.level || 1) : '–';
    document.getElementById('profilePoints').textContent = `${user ? (user.points || 0) : 0} pt`;

    const listEl = document.getElementById('myObsList');
    if (!user) {
      listEl.innerHTML = `<p class="text-[11.5px] text-ink-700/40">登录后可查看你的观测历史与审核状态。</p>`;
      return;
    }
    const mine = await DataAdapter.getObservations({ userId: user.id });
    if (mine.length === 0) {
      listEl.innerHTML = `<p class="text-[11.5px] text-ink-700/40">还没有提交过观测，去参与守护吧。</p>`;
      return;
    }
    const badge = { pending: 'bg-amber-400/15 text-amber-600', approved: 'bg-canopy-100 text-canopy-700', rejected: 'bg-coral-500/10 text-coral-600' };
    const label = { pending: '待审核', approved: '已通过', rejected: '未通过' };
    listEl.innerHTML = mine.map((o, i) => `
      <div class="flex items-center justify-between text-[11.5px] border-b hairline pb-2 fade-up" style="animation-delay: ${i * 30}ms;">
        <span class="text-ink-700/80">${o.commonName} · ${o.eventDate}</span>
        <span class="px-2 py-0.5 rounded-full font-mono text-[10px] ${badge[o.status]}">${label[o.status]}</span>
      </div>
    `).join('');
  }

  async function renderLeaderboard() {
    const board = await DataAdapter.getLeaderboard();
    const el = document.getElementById('leaderboardList');
    if (board.length === 0) {
      el.innerHTML = `<p class="text-[11.5px] text-ink-700/40 col-span-2">还没有公众账号积分记录，登录并完成一次审核通过的观测即可上榜。</p>`;
      return;
    }
    el.innerHTML = board.map((u, i) => `
      <div class="flex items-center gap-3 bg-white/60 border hairline rounded-xl px-3.5 py-2.5 fade-up" style="animation-delay: ${i * 30}ms;">
        <span class="w-6 h-6 rounded-full ${i < 3 ? 'bg-gold-500 text-white' : 'bg-canopy-50 text-canopy-700'} flex items-center justify-center text-[10px] font-mono font-semibold">${i + 1}</span>
        <span class="text-[12px] font-medium text-ink-800 flex-1 truncate">${u.nickname}</span>
        <span class="text-[11px] font-mono text-canopy-700 font-semibold">${u.points || 0} pt</span>
      </div>
    `).join('');
  }

  async function renderHeroStats() {
    const stats = await DataAdapter.getDashboardStats();
    document.getElementById('heroStatObs').textContent = stats.cards.totalObservations;
    document.getElementById('heroStatUrgent').textContent = stats.cards.activeReports;
  }

  async function renderDashboardAccess() {
    const user = await DataAdapter.getCurrentUser();
    const unlocked = !!(user && user.role === 'admin');
    document.getElementById('dashLocked').classList.toggle('hidden', unlocked);
    document.getElementById('dashUnlocked').classList.toggle('hidden', !unlocked);
    if (unlocked) await renderDashboard();
  }

  async function renderDashboard() {
    document.getElementById('dashDate').textContent = new Date().toLocaleDateString('zh-CN');
    const stats = await DataAdapter.getDashboardStats();
    document.getElementById('statTotal').textContent = stats.cards.totalObservations;
    document.getElementById('statSpecies').textContent = stats.cards.activeSpeciesCount;
    document.getElementById('statPending').textContent = stats.cards.pendingReviews;
    document.getElementById('statReports').textContent = stats.cards.activeReports;

    const pending = await DataAdapter.getObservations({ status: 'pending' });
    const tbody = document.getElementById('pendingTableBody');
    tbody.innerHTML = pending.length === 0
      ? `<tr><td colspan="6" class="py-8 text-center text-ink-700/40">暂无待审核记录，队列已清空。</td></tr>`
      : pending.map((o, i) => `
        <tr class="fade-up" style="animation-delay: ${i * 30}ms;">
          <td class="py-2.5 pr-3 font-medium text-ink-800">${o.recordedBy}</td>
          <td class="py-2.5 pr-3"><span class="font-semibold text-canopy-800">${o.commonName}</span><br><span class="text-[10px] italic text-ink-700/40">${o.scientificName}</span></td>
          <td class="py-2.5 pr-3 font-mono text-canopy-700">${o.individualCount} 只</td>
          <td class="py-2.5 pr-3 font-mono text-[10px] text-ink-700/50">${o.decimalLatitude.toFixed(3)}, ${o.decimalLongitude.toFixed(3)}</td>
          <td class="py-2.5 pr-3 text-ink-700/50">${o.eventDate}</td>
          <td class="py-2.5 pr-0 text-right space-x-1.5 whitespace-nowrap">
            <button onclick="reviewObs('${o.id}','approved')" class="bg-canopy-700 hover:bg-canopy-800 text-white text-[10px] font-semibold px-3 py-1.5 rounded-full transition-colors">通过</button>
            <button onclick="reviewObs('${o.id}','rejected')" class="bg-ink-800/10 hover:bg-ink-800/20 text-ink-700 text-[10px] font-semibold px-3 py-1.5 rounded-full transition-colors">驳回</button>
          </td>
        </tr>
      `).join('');

    const reports = await DataAdapter.getReports({ status: 'pending' });
    const rq = document.getElementById('reportsQueue');
    rq.innerHTML = reports.length === 0
      ? `<p class="text-[12px] text-ink-700/40">暂无待处理异常事件。</p>`
      : reports.map((r, i) => `
        <div class="flex items-center justify-between gap-3 bg-coral-500/5 border border-coral-500/15 rounded-xl px-4 py-3 fade-up" style="animation-delay: ${i * 30}ms;">
          <div class="min-w-0">
            <span class="text-[11px] font-mono text-coral-600 font-semibold uppercase">${r.type === 'injured' ? '受伤/受困' : r.type === 'hunting' ? '非法捕猎' : '栖息地破坏'}</span>
            <p class="text-[12px] text-ink-800 truncate">${r.location} · ${r.description}</p>
          </div>
          <button onclick="resolveReportItem('${r.id}')" class="shrink-0 bg-coral-600 hover:bg-coral-500 text-white text-[10px] font-semibold px-3 py-1.5 rounded-full transition-colors">标记已处理</button>
        </div>
      `).join('');

    renderCharts(stats.charts);
    renderScatterMap(await DataAdapter.getObservations({ status: 'approved' }));
  }

  function renderCharts(chartData) {
    const trendCtx = document.getElementById('trendChart').getContext('2d');
    const pieCtx = document.getElementById('pieChart').getContext('2d');
    if (trendChart) trendChart.destroy();
    if (pieChart) pieChart.destroy();

    trendChart = new Chart(trendCtx, {
      type: 'line',
      data: {
        labels: chartData.monthlyTrend.labels,
        datasets: [{
          label: '有效观测数',
          data: chartData.monthlyTrend.data,
          borderColor: '#245A41',
          backgroundColor: 'rgba(36,90,65,0.08)',
          borderWidth: 2.5,
          tension: 0.4,
          fill: true,
          pointRadius: 3,
          pointBackgroundColor: '#245A41'
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, grid: { color: 'rgba(18,42,34,0.06)' } }, x: { grid: { display: false } } }
      }
    });

    pieChart = new Chart(pieCtx, {
      type: 'doughnut',
      data: {
        labels: chartData.conservationPie.labels,
        datasets: [{
          data: chartData.conservationPie.data,
          backgroundColor: ['#245A41', '#8DA891', '#E3A34D', '#D1482F', '#B8933B'],
          borderWidth: 0
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } } }
    });
  }

  function renderScatterMap(observations) {
    const el = document.getElementById('scatterMap');
    el.innerHTML = '';
    if (observations.length === 0) return;
    const lats = observations.map(o => o.decimalLatitude);
    const lngs = observations.map(o => o.decimalLongitude);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    observations.slice(0, 60).forEach(o => {
      const x = maxLng === minLng ? 50 : ((o.decimalLongitude - minLng) / (maxLng - minLng)) * 88 + 6;
      const y = maxLat === minLat ? 50 : (1 - (o.decimalLatitude - minLat) / (maxLat - minLat)) * 78 + 8;
      const dot = document.createElement('div');
      dot.className = 'absolute w-2 h-2 rounded-full bg-canopy-600/70';
      dot.style.left = x + '%';
      dot.style.top = y + '%';
      dot.title = `${o.commonName} · ${o.eventDate}`;
      el.appendChild(dot);
    });
  }

  async function reviewObs(id, status) {
    await DataAdapter.reviewObservation(id, status);
    toast(status === 'approved' ? '已通过审核 · 已发放 100 pt' : '已驳回该记录');
    await refreshAll();
  }

  async function resolveReportItem(id) {
    await DataAdapter.resolveReport(id);
    toast('该异常事件已标记为已处理');
    await refreshAll();
  }

  function exportCSV() {
    DataAdapter.getObservations().then(data => {
      let csv = "data:text/csv;charset=utf-8,\ufeffID,RecordedBy,CommonName,ScientificName,Count,Latitude,Longitude,Status,SubmittedAt\n";
      data.forEach(o => {
        csv += `${o.id},${o.recordedBy},${o.commonName},${o.scientificName},${o.individualCount},${o.decimalLatitude},${o.decimalLongitude},${o.status},${o.submittedAt}\n`;
      });
      const link = document.createElement('a');
      link.href = encodeURI(csv);
      link.download = `WingGuard_Observations_${new Date().toISOString().slice(0,10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }

  async function refreshAll() {
    await Promise.all([
      renderNav(),
      renderSpeciesGallery(),
      renderProfile(),
      renderLeaderboard(),
      renderHeroStats(),
      renderDashboardAccess()
    ]);
  }

  document.addEventListener('DOMContentLoaded', refreshAll);

  // expose for inline HTML handlers (script is non-module, already global,
  // but declared explicitly here for clarity/robustness)
  window.openAuthModal = openAuthModal;
  window.closeModal = closeModal;
  window.switchAuthTab = switchAuthTab;
  window.handleAuthSubmit = handleAuthSubmit;
  window.handleSignOut = handleSignOut;
  window.openObsModal = openObsModal;
  window.handleObsSubmit = handleObsSubmit;
  window.openReportModal = openReportModal;
  window.handleReportSubmit = handleReportSubmit;
  window.selectGuardian = selectGuardian;
  window.reviewObs = reviewObs;
  window.resolveReportItem = resolveReportItem;
  window.exportCSV = exportCSV;
