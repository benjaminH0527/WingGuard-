/**
 * =========================================================================
 * DataAdapter — 红檬智型 (WingGuard) 统一数据适配层
 * =========================================================================
 * 架构说明：
 *   本文件是全平台唯一允许读写数据的地方。UI 代码永远不直接碰 localStorage
 *   或 Supabase 客户端，只调用 DataAdapter.xxx()。
 *
 *   现状：
 *     - 身份认证 / 用户档案 (signUp / signIn / signOut / getCurrentUser)
 *       是唯一从第一天就对接真实后端的部分：Supabase Auth + Postgres profiles 表。
 *     - 生态业务数据 (观测记录 / 物种百科 / 异常举报) 目前读写浏览器 localStorage
 *       中的 mock 数据，字段命名参考 GBIF Darwin Core 规范
 *       (scientificName / eventDate / decimalLatitude / decimalLongitude /
 *        individualCount / recordedBy)，方便未来无痛切换。
 *
 *   未来接入真实生态管理部门 API 时：
 *     只需要把本文件里标记为 "MOCK 实现" 的方法体，替换成对应的
 *     fetch('/api/xxx', {...}) 调用，保持函数签名、入参、返回值结构不变，
 *     UI 层（main.html 里的渲染函数）不需要任何改动。
 *
 *   本文件以 <script src="js/DataAdapter.js"></script> 的普通脚本方式加载
 *   （不是 ES Module），因此可以在 file:// 协议下直接双击打开也不会报
 *   CORS 错误；同时把所有方法挂在全局 window.DataAdapter 上，方便 HTML
 *   内联的 onclick 直接调用。
 * =========================================================================
 */

import { createClient } from '@supabase/supabase-js';
import { ENV } from './env.js';

let supabaseClient = null;
try {
  if (ENV.FORCE_LOCAL_MOCK) {
    console.warn("提示：已通过 FORCE_LOCAL_MOCK 强行回退到本地演示模式，将忽略真实的 Supabase 配置。");
  } else if (ENV.SUPABASE_URL && ENV.SUPABASE_ANON_KEY) {
    supabaseClient = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY);
  }
} catch (e) {
  console.warn("Supabase 客户端初始化失败，将回退到本地演示模式：", e);
}
  const LS_KEYS = {
    species: "wg_species",
    observations: "wg_observations",
    reports: "wg_reports",
    currentUser: "wg_current_user",
    localAccounts: "wg_local_accounts" // 离线演示兜底账号（Supabase 未配置时使用）
  };

  // ------------------------------------------------------------------
  // 初始 Mock 数据
  // ------------------------------------------------------------------
  const INITIAL_SPECIES = [
    {
      id: "sp-01",
      scientificName: "Ciconia boyciana",
      commonName: "东方白鹳",
      conservationStatus: "国家一级",
      habitat: "大型湿地、沼泽、水库浅滩",
      description:
        "大型涉禽，体长约1.1–1.3米，嘴黑色而基部粗厚，眼周裸露皮肤呈醒目红色。全球种群数量稀少，是东亚湿地生态健康的重要指示物种。",
      imageUrl: "/Ciconia-boyciana.webp"
    },
    {
      id: "sp-02",
      scientificName: "Nipponia nippon",
      commonName: "朱鹮",
      conservationStatus: "国家一级",
      habitat: "温带山地丘陵、稻田、溪流湿地",
      description:
        "素有“东方宝石”之称，体羽多为白色并微染粉红，后枕部有柳叶状羽冠。曾一度被认为野外灭绝，是人工保育成功的旗舰物种。",
      imageUrl: "/Nipponia-nippon.png"
    },
    {
      id: "sp-03",
      scientificName: "Aegithalos concinnus",
      commonName: "红头长尾山雀",
      conservationStatus: "三有保护",
      habitat: "针阔混交林、灌木丛、公园绿地",
      description:
        "网络著名的“小肥啾”之一，头顶栗红、喉部一枚黑斑，性活泼喜结群，是校园与城市公园里最容易被公众观测到的鸟种之一。",
      imageUrl: "/Aegithalos-concinnus.webp"
    },
    {
      id: "sp-04",
      scientificName: "Ardea cinerea",
      commonName: "苍鹭",
      conservationStatus: "三有保护",
      habitat: "江河、湖泊、海岸浅水区",
      description:
        "大型水鸟，颈、脚、嘴修长，体羽以灰色为主。常长时间静立浅水中伺机捕食鱼虾，民间俗称“老等”，是湿地食物链的重要一环。",
      imageUrl: "/Ardea-cinerea.jpg"
    },
    {
      id: "sp-05",
      scientificName: "Alcedo atthis",
      commonName: "普通翠鸟",
      conservationStatus: "三有保护",
      habitat: "溪流、池塘、河岸土坡",
      description:
        "体型小巧，羽色艳丽如宝石，善于俯冲入水捕鱼，是许多观鸟爱好者入门的“梦幻鸟种”，对水质极为敏感。",
      imageUrl: "/Alcedo-atthis.webp"
    },
    {
      id: "sp-06",
      scientificName: "Grus japonensis",
      commonName: "丹顶鹤",
      conservationStatus: "国家一级",
      habitat: "沼泽湿地、芦苇荡、滩涂",
      description:
        "体态优雅，顶冠裸皮呈朱红色，是长寿与吉祥的文化象征。对栖息地完整性要求极高，是区域生态保护成效的旗舰指标。",
      imageUrl: "/Grus-japonensis.jpg"
    }
  ];

  function uid(prefix) {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }

  function randomDateInLastNDays(days) {
    const now = Date.now();
    const past = now - days * 24 * 60 * 60 * 1000;
    return new Date(past + Math.random() * (now - past));
  }

  function generateMockObservations() {
    const list = [];
    const baseLat = 31.2304; // 示例：城市湿地公园周边
    const baseLng = 121.4737;
    const names = ["林晓", "陈观鸟", "苏小满", "阿泽", "夏芒", "顾知行", "云屿", "然然"];

    for (let i = 1; i <= 52; i++) {
      const sp = INITIAL_SPECIES[Math.floor(Math.random() * INITIAL_SPECIES.length)];
      const roll = Math.random();
      const status = roll < 0.62 ? "approved" : roll < 0.82 ? "pending" : "rejected";
      const date = randomDateInLastNDays(90);

      list.push({
        id: uid("obs"),
        speciesId: sp.id,
        scientificName: sp.scientificName,
        commonName: sp.commonName,
        userId: `mock-user-${100 + (i % names.length)}`,
        recordedBy: names[i % names.length],
        eventDate: date.toISOString().slice(0, 10),
        decimalLatitude: Number((baseLat + (Math.random() - 0.5) * 0.09).toFixed(5)),
        decimalLongitude: Number((baseLng + (Math.random() - 0.5) * 0.09).toFixed(5)),
        individualCount: Math.floor(Math.random() * 6) + 1,
        photoUrl: sp.imageUrl,
        note: "在保护区例行巡护路线上观测到，行为正常，环境未见明显干扰。",
        status: status,
        submittedAt: date.toISOString()
      });
    }
    return list.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  }

  function ensureSeedData() {
    // 强制更新物种数据以应用新的本地图片路径
    localStorage.setItem(LS_KEYS.species, JSON.stringify(INITIAL_SPECIES));
    
    if (!localStorage.getItem(LS_KEYS.observations)) {
      localStorage.setItem(LS_KEYS.observations, JSON.stringify(generateMockObservations()));
    }
    if (!localStorage.getItem(LS_KEYS.reports)) {
      localStorage.setItem(
        LS_KEYS.reports,
        JSON.stringify([
          {
            id: uid("rep"),
            userId: "mock-user-101",
            type: "injured",
            location: "湿地公园东门人工湖畔",
            description: "发现一只红头长尾山雀翅膀受伤，无法正常起飞，暂时用纸箱临时安置。",
            photoUrl: "",
            status: "pending",
            submittedAt: new Date().toISOString()
          }
        ])
      );
    }
    if (!localStorage.getItem(LS_KEYS.localAccounts)) {
      localStorage.setItem(LS_KEYS.localAccounts, JSON.stringify([]));
    }
  }
  ensureSeedData();

  function readLS(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) || [];
    } catch (e) {
      return [];
    }
  }
  function writeLS(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  // ------------------------------------------------------------------
  // 离线演示兜底：当 Supabase 未配置/网络不可用时，用 localStorage 模拟
  // 一套最简账号体系，保证在没有真实后端时也能演示完整闭环。
  // ------------------------------------------------------------------
  function localSignUp(email, password, role, extra) {
    const accounts = readLS(LS_KEYS.localAccounts);
    if (accounts.find((a) => a.email === email)) {
      throw new Error("该邮箱已注册过（本地演示模式）");
    }
    const profile = {
      id: uid("local-user"),
      email,
      password, // 仅用于本地无后端演示，真实项目绝不会明文存密码
      role: role,
      nickname: extra.nickname || "守护使者",
      organization: extra.organization || null,
      guardian_species_id: extra.guardianSpeciesId || null,
      points: 0,
      level: 1,
      created_at: new Date().toISOString()
    };
    accounts.push(profile);
    writeLS(LS_KEYS.localAccounts, accounts);
    return profile;
  }

  function localSignIn(email, password) {
    const accounts = readLS(LS_KEYS.localAccounts);
    const found = accounts.find((a) => a.email === email && a.password === password);
    if (!found) throw new Error("邮箱或密码错误（本地演示模式）");
    writeLS(LS_KEYS.currentUser, found);
    return { user: found, profile: found };
  }

  // ==================== DataAdapter 对外接口 ====================
  const DataAdapter = {
    /** 标记当前是否连上了真实 Supabase 后端 */
    isBackendConnected: !!supabaseClient,

    // ---------------- AUTH 认证方法 ----------------

    /**
     * 注册账号
     * @param {string} email
     * @param {string} password
     * @param {'public'|'admin'} role
     * @param {{nickname?:string, organization?:string, guardianSpeciesId?:string}} profileExtra
     * @returns {Promise<Object>} 新建的用户/档案对象
     */
    async signUp(email, password, role, profileExtra = {}) {
      if (supabaseClient) {
        const { data, error } = await supabaseClient.auth.signUp({
          email,
          password,
          options: {
            data: {
              role,
              nickname: profileExtra.nickname || "守护使者",
              organization: profileExtra.organization || null,
              guardian_species_id: profileExtra.guardianSpeciesId || null
            }
          }
        });
        if (error) {
          if (error.message.includes('rate limit')) {
            throw new Error('测试频次超限 (Supabase 每小时限制3次)，请稍后再试或在 env.js 中开启 FORCE_LOCAL_MOCK 模式');
          }
          throw error;
        }
        return data.user;
      }
      return localSignUp(email, password, role, profileExtra);
    },

    /**
     * 登录
     * @param {string} email
     * @param {string} password
     * @returns {Promise<{user:Object, profile:Object}>}
     */
    async signIn(email, password) {
      if (supabaseClient) {
        const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
          email,
          password
        });
        if (authError) {
          if (authError.message.includes('Invalid login credentials')) {
            throw new Error('邮箱密码错误，或者邮箱尚未验证（请检查收件箱，或在 Supabase 后台关闭邮件验证）');
          }
          throw authError;
        }

        const { data: profile, error: profError } = await supabaseClient
          .from("profiles")
          .select("*")
          .eq("id", authData.user.id)
          .single();
        
        if (profError) {
          if (profError.code === 'PGRST116') {
            throw new Error('登录成功，但未找到用户档案 (Profiles 表)。请检查数据库触发器 `on_auth_user_created` 是否成功执行。');
          }
          throw profError;
        }

        writeLS(LS_KEYS.currentUser, profile);
        return { user: authData.user, profile };
      }
      return localSignIn(email, password);
    },

    /** 退出登录 */
    async signOut() {
      if (supabaseClient) {
        await supabaseClient.auth.signOut();
      }
      localStorage.removeItem(LS_KEYS.currentUser);
    },

    /**
     * 获取当前登录用户的 profile
     * @returns {Promise<Object|null>}
     */
    async getCurrentUser() {
      if (supabaseClient) {
        const { data } = await supabaseClient.auth.getUser();
        const user = data && data.user;
        if (user) {
          const { data: profile } = await supabaseClient.from("profiles").select("*").eq("id", user.id).single();
          if (profile) {
            writeLS(LS_KEYS.currentUser, profile);
            return profile;
          }
        }
      }
      const cached = localStorage.getItem(LS_KEYS.currentUser);
      return cached ? JSON.parse(cached) : null;
    },

    // ---------------- 生态业务数据方法（MOCK 实现，见文件头说明） ----------------

    /**
     * 获取观测记录列表
     * @param {{status?:string, userId?:string, speciesId?:string}} filters
     * @returns {Promise<Array>}
     */
    async getObservations(filters = {}) {
      if (supabaseClient) {
        let query = supabaseClient.from('observations').select('*').order('submitted_at', { ascending: false });
        if (filters.status) query = query.eq('status', filters.status);
        if (filters.userId) query = query.eq('user_id', filters.userId);
        if (filters.speciesId) query = query.eq('species_id', filters.speciesId);
        
        const { data, error } = await query;
        if (error) throw error;
        
        return data.map(o => ({
          id: o.id,
          speciesId: o.species_id,
          scientificName: o.scientific_name,
          commonName: o.common_name,
          userId: o.user_id,
          recordedBy: o.recorded_by,
          eventDate: o.event_date,
          decimalLatitude: o.decimal_latitude,
          decimalLongitude: o.decimal_longitude,
          individualCount: o.individual_count,
          photoUrl: o.photo_url,
          note: o.note,
          status: o.status,
          submittedAt: o.submitted_at
        }));
      }

      let list = readLS(LS_KEYS.observations);
      if (filters.status) list = list.filter((o) => o.status === filters.status);
      if (filters.userId) list = list.filter((o) => o.userId === filters.userId);
      if (filters.speciesId) list = list.filter((o) => o.speciesId === filters.speciesId);
      return list.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    },

    /**
     * 提交新的观测记录
     * @param {{speciesId:string, individualCount:number, decimalLatitude:number, decimalLongitude:number, note?:string, photoUrl?:string}} data
     * @returns {Promise<Object>}
     */
    async submitObservation(data) {
      const user = await this.getCurrentUser();
      if (!user) throw new Error("请先登录后再提交观测记录");

      const speciesList = await this.getSpecies();
      const sp = speciesList.find((s) => s.id === data.speciesId);

      const isLocal = String(user.id).startsWith("mock-user-") || String(user.id).startsWith("local-user-");

      if (supabaseClient && !isLocal) {
        const record = {
          species_id: data.speciesId || null,
          scientific_name: sp ? sp.scientificName : (data.scientificName || "Unknown"),
          common_name: sp ? sp.commonName : (data.commonName || "未知鸟种"),
          user_id: user.id,
          recorded_by: user.nickname || "热心观测员",
          event_date: new Date().toISOString().slice(0, 10),
          decimal_latitude: Number(data.decimalLatitude) || 31.2304,
          decimal_longitude: Number(data.decimalLongitude) || 121.4737,
          individual_count: Math.max(1, parseInt(data.individualCount, 10) || 1),
          photo_url: data.photoUrl || (sp ? sp.imageUrl : ""),
          note: data.note || "",
          status: "pending"
        };
        const { data: inserted, error } = await supabaseClient.from('observations').insert(record).select().single();
        if (error) throw error;
        return {
          id: inserted.id,
          speciesId: inserted.species_id,
          scientificName: inserted.scientific_name,
          commonName: inserted.common_name,
          userId: inserted.user_id,
          recordedBy: inserted.recorded_by,
          eventDate: inserted.event_date,
          decimalLatitude: inserted.decimal_latitude,
          decimalLongitude: inserted.decimal_longitude,
          individualCount: inserted.individual_count,
          photoUrl: inserted.photo_url,
          note: inserted.note,
          status: inserted.status,
          submittedAt: inserted.submitted_at
        };
      }

      const record = {
        id: uid("obs"),
        speciesId: data.speciesId || "unknown",
        scientificName: sp ? sp.scientificName : (data.scientificName || "Unknown"),
        commonName: sp ? sp.commonName : (data.commonName || "未知鸟种"),
        userId: user.id,
        recordedBy: user.nickname || "热心观测员",
        eventDate: new Date().toISOString().slice(0, 10),
        decimalLatitude: Number(data.decimalLatitude) || 31.2304,
        decimalLongitude: Number(data.decimalLongitude) || 121.4737,
        individualCount: Math.max(1, parseInt(data.individualCount, 10) || 1),
        photoUrl: data.photoUrl || (sp ? sp.imageUrl : ""),
        note: data.note || "",
        status: "pending",
        submittedAt: new Date().toISOString()
      };

      const list = readLS(LS_KEYS.observations);
      list.unshift(record);
      writeLS(LS_KEYS.observations, list);
      return record;
    },

    /**
     * B端审核观测记录（联动：审核通过会给上报用户加 100 积分并可能升级）
     * @param {string} id
     * @param {'approved'|'rejected'} status
     * @returns {Promise<Object>}
     */
    async reviewObservation(id, status) {
      if (supabaseClient && !String(id).startsWith("obs-")) {
        const { data, error } = await supabaseClient.from('observations').update({ status }).eq('id', id).select().single();
        if (error) throw error;
        
        if (status === "approved") {
          await this._rewardUser(data.user_id, 100);
        }
        
        return {
          id: data.id,
          speciesId: data.species_id,
          scientificName: data.scientific_name,
          commonName: data.common_name,
          userId: data.user_id,
          recordedBy: data.recorded_by,
          eventDate: data.event_date,
          decimalLatitude: data.decimal_latitude,
          decimalLongitude: data.decimal_longitude,
          individualCount: data.individual_count,
          photoUrl: data.photo_url,
          note: data.note,
          status: data.status,
          submittedAt: data.submitted_at
        };
      }

      const list = readLS(LS_KEYS.observations);
      const idx = list.findIndex((o) => o.id === id);
      if (idx === -1) throw new Error("未找到该观测记录");

      list[idx].status = status;
      writeLS(LS_KEYS.observations, list);

      if (status === "approved") {
        await this._rewardUser(list[idx].userId, 100);
      }
      return list[idx];
    },

    /** 内部方法：给用户加积分并按 300 分一级重新计算等级 */
    async _rewardUser(userId, points) {
      if (supabaseClient && !String(userId).startsWith("mock-user-") && !String(userId).startsWith("local-user-")) {
        const { data: prof } = await supabaseClient.from("profiles").select("points, level").eq("id", userId).single();
        if (prof) {
          const nextPoints = (prof.points || 0) + points;
          const nextLevel = Math.floor(nextPoints / 300) + 1;
          await supabaseClient.from("profiles").update({ points: nextPoints, level: nextLevel }).eq("id", userId);
        }
      } else {
        // 本地演示账号：直接更新 localStorage 里的账号池 + 当前登录缓存
        const accounts = readLS(LS_KEYS.localAccounts);
        const acc = accounts.find((a) => a.id === userId);
        if (acc) {
          acc.points = (acc.points || 0) + points;
          acc.level = Math.floor(acc.points / 300) + 1;
          writeLS(LS_KEYS.localAccounts, accounts);
        }
        const current = await this.getCurrentUser();
        if (current && current.id === userId) {
          current.points = (current.points || 0) + points;
          current.level = Math.floor(current.points / 300) + 1;
          writeLS(LS_KEYS.currentUser, current);
        }
      }
    },

    /**
     * 获取物种百科列表
     * @returns {Promise<Array>}
     */
    async getSpecies() {
      if (supabaseClient) {
        const { data, error } = await supabaseClient.from('species').select('*');
        if (!error && data && data.length > 0) {
          return data.map(s => ({
            id: s.id,
            scientificName: s.scientific_name,
            commonName: s.common_name,
            conservationStatus: s.conservation_status,
            habitat: s.habitat,
            description: s.description,
            imageUrl: s.id === 'sp-03' ? '/Aegithalos-concinnus.webp' : (s.id === 'sp-02' ? '/Nipponia-nippon.png' : s.image_url)
          }));
        }
      }
      return readLS(LS_KEYS.species);
    },

    /**
     * 提交异常举报（受伤/非法捕猎等）
     * @param {{type:string, location:string, description:string, photoUrl?:string}} data
     * @returns {Promise<Object>}
     */
    async submitReport(data) {
      const user = await this.getCurrentUser();
      const isLocal = user && (String(user.id).startsWith("mock-user-") || String(user.id).startsWith("local-user-"));
      
      if (supabaseClient && !isLocal) {
        const record = {
          user_id: user ? user.id : null,
          type: data.type,
          location: data.location,
          description: data.description,
          photo_url: data.photoUrl || "",
          status: "pending"
        };
        const { data: inserted, error } = await supabaseClient.from('reports').insert(record).select().single();
        if (error) throw error;
        return {
          id: inserted.id,
          userId: inserted.user_id,
          type: inserted.type,
          location: inserted.location,
          description: inserted.description,
          photoUrl: inserted.photo_url,
          status: inserted.status,
          submittedAt: inserted.submitted_at
        };
      }

      const record = {
        id: uid("rep"),
        userId: user ? user.id : "anonymous",
        type: data.type,
        location: data.location,
        description: data.description,
        photoUrl: data.photoUrl || "",
        status: "pending",
        submittedAt: new Date().toISOString()
      };
      const list = readLS(LS_KEYS.reports);
      list.unshift(record);
      writeLS(LS_KEYS.reports, list);
      return record;
    },

    /**
     * 获取异常举报列表
     * @param {{status?:string}} filters
     * @returns {Promise<Array>}
     */
    async getReports(filters = {}) {
      if (supabaseClient) {
        let query = supabaseClient.from('reports').select('*').order('submitted_at', { ascending: false });
        if (filters.status) query = query.eq('status', filters.status);
        
        const { data, error } = await query;
        if (error) throw error;
        
        return data.map(r => ({
          id: r.id,
          userId: r.user_id,
          type: r.type,
          location: r.location,
          description: r.description,
          photoUrl: r.photo_url,
          status: r.status,
          submittedAt: r.submitted_at
        }));
      }

      let list = readLS(LS_KEYS.reports);
      if (filters.status) list = list.filter((r) => r.status === filters.status);
      return list.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    },

    /**
     * B端处理举报（标记为已处理）
     * @param {string} id
     * @returns {Promise<Object>}
     */
    async resolveReport(id) {
      if (supabaseClient && !String(id).startsWith("rep-")) {
        const { data, error } = await supabaseClient.from('reports').update({ status: 'processed' }).eq('id', id).select().single();
        if (error) throw error;
        return {
          id: data.id,
          userId: data.user_id,
          type: data.type,
          location: data.location,
          description: data.description,
          photoUrl: data.photo_url,
          status: data.status,
          submittedAt: data.submitted_at
        };
      }

      const list = readLS(LS_KEYS.reports);
      const idx = list.findIndex((r) => r.id === id);
      if (idx === -1) throw new Error("未找到该举报记录");
      list[idx].status = "processed";
      writeLS(LS_KEYS.reports, list);
      return list[idx];
    },

    /**
     * 排行榜（按积分排序；混合本地演示账号与已知 mock 上报人）
     * @returns {Promise<Array>}
     */
    async getLeaderboard() {
      if (supabaseClient) {
        const { data, error } = await supabaseClient
          .from('profiles')
          .select('*')
          .eq('role', 'public')
          .order('points', { ascending: false })
          .limit(10);
          
        if (!error && data && data.length > 0) {
          const localAccounts = readLS(LS_KEYS.localAccounts).filter((a) => a.role === "public");
          const current = await this.getCurrentUser();
          const merged = [...data, ...localAccounts];
          if (current && current.role === "public" && !merged.find((a) => a.id === current.id)) {
            merged.push(current);
          }
          return merged.sort((a, b) => (b.points || 0) - (a.points || 0)).slice(0, 10);
        }
      }

      const accounts = readLS(LS_KEYS.localAccounts).filter((a) => a.role === "public");
      const current = await this.getCurrentUser();
      const merged = [...accounts];
      if (current && current.role === "public" && !merged.find((a) => a.id === current.id)) {
        merged.push(current);
      }
      return merged.sort((a, b) => (b.points || 0) - (a.points || 0)).slice(0, 10);
    },

    /**
     * B端仪表盘统计数据（供 Chart.js 消费）
     * @returns {Promise<Object>}
     */
    async getDashboardStats() {
      const obs = await this.getObservations();
      const reports = await this.getReports();
      const approved = obs.filter((o) => o.status === "approved");
      const pending = obs.filter((o) => o.status === "pending");

      const totalObservations = approved.length;
      const activeSpeciesCount = new Set(approved.map((o) => o.speciesId)).size;
      const pendingReviews = pending.length;
      const activeReports = reports.filter((r) => r.status === "pending").length;

      // 近 6 个月月度趋势
      const months = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: `${d.getMonth() + 1}月` });
      }
      const trendData = months.map((m) => approved.filter((o) => o.eventDate.startsWith(m.key)).length);

      const species = await this.getSpecies();
      const levelCounts = {};
      approved.forEach((o) => {
        const sp = species.find((s) => s.id === o.speciesId);
        const level = sp ? sp.conservationStatus : "其他";
        levelCounts[level] = (levelCounts[level] || 0) + 1;
      });

      return {
        cards: { totalObservations, activeSpeciesCount, pendingReviews, activeReports },
        charts: {
          monthlyTrend: { labels: months.map((m) => m.label), data: trendData },
          conservationPie: { labels: Object.keys(levelCounts), data: Object.values(levelCounts) }
        }
      };
    }
  };

  export { DataAdapter };
