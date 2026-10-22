async function testParallel() {
  const pUrls = [
    'https://player.tokusatsuindo.com/x/?t=eyJ2aWRlb19pZCI6MzN9.be89d23b1c359699ca056c5e164dc18f813fa285d88822d5cd6034f3d4391ac2',
    'https://player.tokusatsuindo.com/x/?t=eyJ2aWRlb19pZCI6MzR9.d9f75923426573659685a353f703548a9d2603a91d17e4139c451248a7da9548',
    'https://player.tokusatsuindo.com/x/?t=eyJ2aWRlb19pZCI6MzV9.5a68a51299f6df5d7f2d65e0f8089cfa660022dca071f0b56da6ba023a3dfb65',
    'https://player.tokusatsuindo.com/x/?t=eyJ2aWRlb19pZCI6MzZ9.414f1df1a3f30ee84a4b3544811a58ec77900a002127320d783fdfc0e0615cdd',
    'https://player.tokusatsuindo.com/x/?t=eyJ2aWRlb19pZCI6Mzd9.be98b54fe28b5e192c990703252de16f0c626d858af9b59dbeae6d582f72b627'
  ];
  
  const start = Date.now();
  const results = await Promise.all(pUrls.map(async u => {
    try {
      const r = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://www.tokusatsuindo.com/' } });
      const t = await r.text();
      const m = t.match(/data-src=["']([^"']+)["']/);
      if (m) {
        const tm = m[1].match(/t=([A-Za-z0-9_-]+)\./);
        if (tm) {
          let b64 = tm[1].replace(/-/g, '+').replace(/_/g, '/');
          while (b64.length % 4) b64 += '=';
          return JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
        }
      }
    } catch(e) {}
    return null;
  }));
  console.log('Time taken for 5:', Date.now() - start, 'ms');
  console.log('Results:', results.map(r => r ? r.google_drive_url_1 || r.file_id_1 : null));
}
testParallel();
