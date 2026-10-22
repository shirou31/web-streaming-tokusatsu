async function test() {
  const ids = [
    { name: 'Arc Ep 1 Server 1', id: '1ZawtRzBvTNufMEWid4xcyOevN7r7z74o' },
    { name: 'Arc Ep 1 Server 2', id: '1NDB246gu80NzaJawft4TSjZ8o7V_iY4x' },
    { name: 'Arc Movie Server 1', id: '1clDL6J5vp7UR_Qj6SnObraIuDSO8vTps' },
    { name: 'Geats Movie Server 1', id: '1YV_q4D_h987LzJd41rG1xV41334kL5xM' },
    { name: 'Shin Kamen Rider', id: '1XQ-y6yY5i-bX9sX7L9Z1vW8n1b7p8k2L' },
    { name: 'Den-O Climax Deka', id: '1VlCikk1rorU77lezkhe6ZdKCTqPaoZeS' }
  ];

  for (const item of ids) {
    try {
      const res = await fetch(`https://drive.google.com/file/d/${item.id}/preview`, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      const html = await res.text();
      const m = html.match(/itemJson:\s*\[null,\s*"([^"]+)"/);
      console.log(item.name, '-> Filename:', m ? m[1] : 'not found');
    } catch(err) {
      console.log(item.name, '-> Error:', err.message);
    }
  }
}
test();
