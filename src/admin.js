import { DataAdapter } from './DataAdapter.js';

// =============== 1. Auth & Initialization =============== //

async function checkAuth() {
  const user = await DataAdapter.getCurrentUser();
  if (user && user.role === 'admin') {
    document.getElementById('dashLocked').classList.add('hidden');
    document.getElementById('dashUnlocked').classList.remove('hidden');
    document.getElementById('adminUserPill').classList.remove('hidden');
    document.getElementById('adminUserPill').classList.add('flex');
    
    // 初始化大屏数据
    const d = new Date();
    document.getElementById('reportTime').innerText = d.toLocaleString('zh-CN', { hour12: false });
    
    initDashboard();
  } else {
    document.getElementById('dashLocked').classList.remove('hidden');
    document.getElementById('dashUnlocked').classList.add('hidden');
    document.getElementById('adminUserPill').classList.add('hidden');
    document.getElementById('adminUserPill').classList.remove('flex');
  }
}

// 供全局调用的表单提交方法
window.handleAuthSubmit = async function(e) {
  e.preventDefault();
  const mode = document.getElementById('authForm').dataset.mode || 'signin';
  const email = document.getElementById('authEmail').value;
  const pwd = document.getElementById('authPassword').value;
  
  try {
    if (mode === 'signup') {
      const inviteCode = document.getElementById('authInviteCode').value;
      if (inviteCode !== 'ADMIN2026') {
        alert("邀请码无效，请联系相关部门获取正确的授权码。");
        return;
      }
      const nickname = document.getElementById('authNickname').value;
      
      // Perform signup for admin
      await DataAdapter.signUp(email, pwd, 'admin', { nickname });
      
      // Auto login after signup
      const { profile } = await DataAdapter.signIn(email, pwd);
      if (profile.role !== 'admin') {
        alert("错误：注册角色异常。");
        await DataAdapter.signOut();
        return;
      }
    } else {
      const { profile } = await DataAdapter.signIn(email, pwd);
      if (profile.role !== 'admin') {
        alert("错误：此账号不是管理员账号。");
        await DataAdapter.signOut();
        return;
      }
    }
    
    window.closeModal('authModal');
    window.location.reload();
  } catch (err) {
    alert(err.message || '操作失败');
  }
};

window.addEventListener('DOMContentLoaded', checkAuth);

// =============== 2. Dashboard Data Initialization =============== //

function initDashboard() {
  fetchWeatherData();
  initPopulationChart();
  loadSpeciesTable();
  loadIncidentQueue();
  startSensorFeed();
  initMapCarousel();
  loadPendingObservations();
  loadUserLeaderboard();
  
  // 触发 Stagger 动画
  setTimeout(() => {
    const items = document.querySelectorAll('.stagger-item');
    items.forEach((el, index) => {
      setTimeout(() => el.classList.add('visible'), index * 100); // 100ms 间隔
    });
  }, 100);
}

// =============== 3. Module A: Open-Meteo Weather API =============== //

async function fetchWeatherData() {
  try {
    // 深圳湾大致坐标: 22.52, 113.93
    const url = "https://api.open-meteo.com/v1/forecast?latitude=22.52&longitude=113.93&current=temperature_2m,relative_humidity_2m,wind_speed_10m&timezone=Asia%2FShanghai";
    const res = await fetch(url);
    const data = await res.json();
    
    if (data && data.current) {
      document.getElementById('weatherTemp').innerText = data.current.temperature_2m + '°C';
      document.getElementById('weatherHumidity').innerText = data.current.relative_humidity_2m + '%';
      document.getElementById('weatherWind').innerText = data.current.wind_speed_10m + ' km/h';
    }
  } catch (err) {
    console.error("气象API抓取失败", err);
    // 失败的回退数据 (Mock)
    document.getElementById('weatherTemp').innerText = '21.5°C';
    document.getElementById('weatherHumidity').innerText = '65%';
    document.getElementById('weatherWind').innerText = '12.4 km/h';
  }
}

// =============== 4. Module C: Population ECharts =============== //

function initPopulationChart() {
  const chartDom = document.getElementById('populationChart');
  if (!chartDom) return;
  const myChart = echarts.init(chartDom);
  
  // Tufte 风格: 极简, 无网格线, 高数据墨水比
  const option = {
    color: ['#191919'],
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'none' },
      backgroundColor: '#F5F0E8',
      borderColor: 'rgba(0,0,0,0.1)',
      textStyle: { color: '#191919', fontFamily: 'JetBrains Mono' }
    },
    grid: {
      left: '0%',
      right: '2%',
      bottom: '5%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['2022', '2023', '2024', '2025', '2026'],
      axisLine: { lineStyle: { color: 'rgba(0,0,0,0.2)' } },
      axisTick: { show: false },
      axisLabel: { fontFamily: 'JetBrains Mono', color: '#191919' }
    },
    yAxis: {
      type: 'value',
      splitLine: { show: false }, // 移除横向网格线 (Tufte 规则)
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { fontFamily: 'JetBrains Mono', color: 'rgba(25,25,25,0.6)' }
    },
    series: [
      {
        name: '种群数量 (估算)',
        type: 'bar',
        barWidth: '40%',
        data: [265, 290, 310, 328, 341],
        itemStyle: {
          color: '#14BF96' // Canopy Green
        },
        label: {
          show: true,
          position: 'top',
          fontFamily: 'JetBrains Mono',
          color: '#191919'
        }
      }
    ]
  };
  myChart.setOption(option);
  window.addEventListener('resize', () => myChart.resize());
}

// =============== 4.5. Map Carousel =============== //

function initMapCarousel() {
  const slides = document.querySelectorAll('.map-slide');
  if (slides.length === 0) return;
  const names = ['生态红线卫星图', '深圳湾高程地形图', '基础路网视图'];
  let currentIndex = 0;
  
  setInterval(() => {
    slides[currentIndex].classList.remove('opacity-100');
    slides[currentIndex].classList.add('opacity-0');
    
    currentIndex = (currentIndex + 1) % slides.length;
    
    slides[currentIndex].classList.remove('opacity-0');
    slides[currentIndex].classList.add('opacity-100');
    
    document.getElementById('mapLayerName').innerText = names[currentIndex];
  }, 5000); // 5秒轮播一次
}

// =============== 5. Module F: Species CRUD =============== //

let currentSpeciesList = [];

async function loadSpeciesTable() {
  currentSpeciesList = await DataAdapter.getSpecies();
  const tbody = document.getElementById('speciesTableBody');
  tbody.innerHTML = '';
  
  currentSpeciesList.forEach(sp => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="py-3 pr-4 font-semibold">${sp.scientificName} <br><span class="text-xs text-[#191919]/50 font-sans font-normal">${sp.commonName}</span></td>
      <td class="py-3 px-4 text-xs">${sp.conservationStatus}</td>
      <td class="py-3 px-4 text-right space-x-2">
        <button onclick="window.openSpeciesModal('${sp.id}')" class="text-[#191919]/50 hover:text-[#191919]"><i class="fa-solid fa-pen-to-square"></i></button>
        <button onclick="deleteSpecies('${sp.id}')" class="text-red-500/50 hover:text-red-600"><i class="fa-solid fa-trash"></i></button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// 监听编辑事件填充表单
document.addEventListener('edit-species', (e) => {
  const id = e.detail.id;
  const sp = currentSpeciesList.find(s => s.id === id);
  if (sp) {
    document.getElementById('spScientific').value = sp.scientificName;
    document.getElementById('spCommon').value = sp.commonName;
    document.getElementById('spStatus').value = sp.conservationStatus;
    document.getElementById('spHabitat').value = sp.habitat;
  }
});

window.handleSpeciesSubmit = async function(e) {
  e.preventDefault();
  const id = document.getElementById('spId').value;
  const data = {
    scientificName: document.getElementById('spScientific').value,
    commonName: document.getElementById('spCommon').value,
    conservationStatus: document.getElementById('spStatus').value,
    habitat: document.getElementById('spHabitat').value
  };
  
  try {
    if (id) {
      await DataAdapter.updateSpecies(id, data);
    } else {
      await DataAdapter.addSpecies(data);
    }
    window.closeSpeciesModal();
    loadSpeciesTable();
  } catch(err) {
    alert("保存失败: " + err.message);
  }
};

window.deleteSpecies = async function(id) {
  if (confirm("确定要删除该物种档案吗？")) {
    try {
      await DataAdapter.deleteSpecies(id);
      loadSpeciesTable();
    } catch(err) {
      alert("删除失败: " + err.message);
    }
  }
};


// =============== 6. Module D: Sensor Feed Mock =============== //

const birdNames = ["黑脸琵鹭", "东方白鹳", "白鹭", "普通翠鸟", "反嘴鹬", "黑尾塍鹬", "苍鹭"];
const behaviors = ["觅食", "停歇", "盘旋飞越", "鸣叫警示"];
const sources = ["凤塘河口高空探头", "红树林保护区边界热像仪", "市民观测打卡 (App)", "水文监测浮标附载声纹设备"];

function generateFeedItem() {
  const now = new Date();
  const timeStr = `[${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}]`;
  const isCitizen = Math.random() > 0.7;
  const source = isCitizen ? sources[2] : sources[Math.floor(Math.random() * sources.length)];
  const bird = birdNames[Math.floor(Math.random() * birdNames.length)];
  const num = Math.floor(Math.random() * 50) + 1;
  const behavior = behaviors[Math.floor(Math.random() * behaviors.length)];
  const icon = isCitizen ? '<i class="fa-solid fa-mobile-screen-button opacity-50 w-4"></i>' : '<i class="fa-solid fa-camera opacity-50 w-4"></i>';
  
  return `${icon} ${timeStr} 来源: ${source} | 监测到: ${bird} ${num}只 | 状态: ${behavior}`;
}

function startSensorFeed() {
  const feed = document.getElementById('sensorFeed');
  if(!feed) return;
  
  // 初始化几个
  for(let i=0; i<5; i++) {
    const div = document.createElement('div');
    div.className = 'border-b hairline-border pb-2 opacity-70';
    div.innerHTML = generateFeedItem();
    feed.appendChild(div);
  }
  
  setInterval(() => {
    const div = document.createElement('div');
    // 物理动效：通过 CSS transition 实现平滑出现
    div.className = 'border-b hairline-border pb-2 opacity-0 transform -translate-x-2 transition-all duration-500';
    div.innerHTML = generateFeedItem();
    feed.insertBefore(div, feed.firstChild);
    
    // Trigger reflow
    void div.offsetWidth;
    div.classList.remove('opacity-0', '-translate-x-2');
    
    if (feed.children.length > 20) {
      feed.removeChild(feed.lastChild);
    }
  }, 3500);
}

// =============== 7. Module E: Incident Response Queue =============== //

async function loadIncidentQueue() {
  const container = document.getElementById('incidentQueue');
  try {
    const reports = await DataAdapter.getReports({ status: 'pending' });
    container.innerHTML = '';
    
    if (reports.length === 0) {
      container.innerHTML = '<div class="text-sm text-[#191919]/50">暂无待处理异常事件</div>';
      return;
    }
    
    reports.slice(0, 5).forEach(r => {
      const d = new Date(r.submittedAt);
      const timeStr = `${d.getMonth()+1}-${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
      const div = document.createElement('div');
      div.className = 'bg-white border hairline-border p-4 text-sm';
      div.innerHTML = `
        <div class="flex justify-between items-start mb-2">
          <span class="font-semibold text-red-600"><i class="fa-solid fa-triangle-exclamation text-xs mr-1"></i> ${r.type === 'injured' ? '受伤鸟类' : '非法活动'}</span>
          <span class="font-mono-num text-[10px] text-[#191919]/40">${timeStr}</span>
        </div>
        <div class="text-[#191919]/80 mb-1"><span class="font-semibold text-[#191919]/50">位置：</span>${r.location}</div>
        <div class="text-[#191919]/80 mb-3"><span class="font-semibold text-[#191919]/50">描述：</span>${r.description}</div>
        <button onclick="resolveIncident('${r.id}')" class="text-[11px] font-semibold bg-[#14BF96]/10 text-[#0c7a5f] px-3 py-1.5 hover:bg-[#14BF96]/20 transition-colors">标记为已处理</button>
      `;
      container.appendChild(div);
    });
  } catch (err) {
    container.innerHTML = '<div class="text-sm text-red-500">无法加载数据</div>';
  }
}

window.resolveIncident = async function(id) {
  try {
    await DataAdapter.resolveReport(id);
    loadIncidentQueue();
  } catch(err) {
    alert("操作失败: " + err.message);
  }
};

// =============== 8. Module G: Observation Queue =============== //

async function loadPendingObservations() {
  const tbody = document.getElementById('observationTableBody');
  if (!tbody) return;
  try {
    const obsList = await DataAdapter.getObservations({ status: 'pending' });
    tbody.innerHTML = '';
    
    if (obsList.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="py-4 text-center text-[#191919]/50">暂无待审核记录</td></tr>';
      return;
    }
    
    obsList.slice(0, 8).forEach(o => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="py-3 pr-4 font-semibold">${o.recordedBy}</td>
        <td class="py-3 pr-4">${o.commonName} <span class="text-[#191919]/50">(${o.individualCount}只)</span></td>
        <td class="py-3 pr-4 text-xs text-[#191919]/60">${o.decimalLatitude.toFixed(3)}, ${o.decimalLongitude.toFixed(3)}</td>
        <td class="py-3 px-4 text-right space-x-2">
          <button onclick="reviewObservation('${o.id}', 'approved')" class="text-[11px] font-semibold bg-[#14BF96]/10 text-[#0c7a5f] px-2 py-1 hover:bg-[#14BF96]/20 transition-colors">通过 (+100pt)</button>
          <button onclick="reviewObservation('${o.id}', 'rejected')" class="text-[11px] font-semibold bg-red-500/10 text-red-600 px-2 py-1 hover:bg-red-500/20 transition-colors">驳回</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("加载观测记录失败", err);
  }
}

window.reviewObservation = async function(id, status) {
  try {
    await DataAdapter.reviewObservation(id, status);
    loadPendingObservations();
    loadUserLeaderboard(); // 更新可能改变的积分
  } catch(err) {
    alert("审核失败: " + err.message);
  }
};

// =============== 9. Module H: User Points Dashboard =============== //

async function loadUserLeaderboard() {
  const tbody = document.getElementById('usersTableBody');
  if (!tbody) return;
  try {
    const users = await DataAdapter.getAllUsers();
    tbody.innerHTML = '';
    
    users.forEach(u => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="py-3 pr-4 font-semibold">${u.nickname || '未命名'} <br><span class="text-xs text-[#191919]/50 font-sans font-normal">${u.email}</span></td>
        <td class="py-3 px-4 text-[#14BF96] font-bold" id="pts-${u.id}">${u.points || 0}</td>
        <td class="py-3 px-4 text-xs">Lv.${u.level || 1}</td>
        <td class="py-3 px-4 text-right">
          <button onclick="editUserPoints('${u.id}', '${u.nickname}')" class="text-xs border hairline-border px-3 py-1 hover:bg-[#191919] hover:text-white transition-colors">修改积分</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("加载用户列表失败", err);
  }
}

window.editUserPoints = async function(userId, nickname) {
  const currentCell = document.getElementById(`pts-${userId}`);
  const currentPts = currentCell ? currentCell.innerText : 0;
  
  const input = prompt(`请输入为 [${nickname}] 修改后的积分数值：`, currentPts);
  if (input !== null) {
    const newPoints = parseInt(input, 10);
    if (isNaN(newPoints)) {
      alert("请输入有效的数字！");
      return;
    }
    try {
      await DataAdapter.updateUserPoints(userId, newPoints);
      loadUserLeaderboard(); // 重新加载列表更新等级
    } catch(err) {
      alert("更新积分失败: " + err.message);
    }
  }
};
