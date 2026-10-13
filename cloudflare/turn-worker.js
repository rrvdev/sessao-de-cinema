// Cloudflare Worker: entrega credenciais temporárias do TURN da Cloudflare para a Sessão de Cinema.
//
// O token da API do TURN fica guardado aqui como segredo (nunca no site, que é público).
// Só responde para o site e, se ALLOWED_IPS estiver preenchido, só para esses IPs.
//
// Variáveis do Worker (Settings → Variables and Secrets):
//   TURN_KEY_ID          (secreto) ID da chave TURN
//   TURN_KEY_API_TOKEN   (secreto) token da API da chave TURN
//   ALLOWED_ORIGINS      (texto)   ex.: https://rrvdev.github.io   (vírgulas para vários)
//   ALLOWED_IPS          (texto)   ex.: 45.7.2.179, 45.7.2.0/24    (vazio ou * = todos)

const TTL = 86400; // 24 h

export default {
  async fetch(request, env) {
    const origins = list(env.ALLOWED_ORIGINS || 'https://rrvdev.github.io');
    const origin = request.headers.get('Origin') || '';
    const okOrigin = origins.includes(origin);
    const headers = {
      'Access-Control-Allow-Origin': okOrigin ? origin : origins[0],
      'Vary': 'Origin',
      'Cache-Control': 'no-store',
      'Content-Type': 'application/json',
    };
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: { ...headers, 'Access-Control-Allow-Methods': 'GET', 'Access-Control-Max-Age': '86400' } });
    }
    if (request.method !== 'GET') return reply({ iceServers: [], reason: 'method' }, 405, headers);
    if (!okOrigin) return reply({ iceServers: [], reason: 'origin' }, 403, headers);

    const ip = request.headers.get('CF-Connecting-IP') || '';
    if (!ipAllowed(ip, env.ALLOWED_IPS)) return reply({ iceServers: [], reason: 'ip' }, 200, headers);

    const r = await fetch(`https://rtc.live.cloudflare.com/v1/turn/keys/${env.TURN_KEY_ID}/credentials/generate-ice-servers`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.TURN_KEY_API_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ttl: TTL }),
    });
    if (!r.ok) return reply({ iceServers: [], reason: 'upstream ' + r.status }, 502, headers);
    const data = await r.json();
    return reply({ iceServers: data.iceServers || [], ttl: TTL }, 200, headers);
  },
};

function reply(body, status, headers) {
  return new Response(JSON.stringify(body), { status, headers });
}

function list(s) {
  return String(s || '').split(',').map((x) => x.trim()).filter(Boolean);
}

// Aceita IP exato (IPv4 ou IPv6) e faixas IPv4 no formato a.b.c.d/nn.
function ipAllowed(ip, allowed) {
  const rules = list(allowed);
  if (!rules.length || rules.includes('*')) return true;
  return rules.some((rule) => {
    if (!rule.includes('/')) return rule.toLowerCase() === ip.toLowerCase();
    const [base, bitsStr] = rule.split('/');
    const bits = Number(bitsStr);
    const a = v4(ip);
    const b = v4(base);
    if (a === null || b === null || !(bits >= 0 && bits <= 32)) return false;
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
    return ((a & mask) >>> 0) === ((b & mask) >>> 0);
  });
}

function v4(s) {
  const p = String(s).split('.');
  if (p.length !== 4) return null;
  let n = 0;
  for (const x of p) {
    const v = Number(x);
    if (!Number.isInteger(v) || v < 0 || v > 255) return null;
    n = n * 256 + v;
  }
  return n >>> 0;
}
