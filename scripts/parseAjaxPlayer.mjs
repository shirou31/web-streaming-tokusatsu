import fs from 'fs';

const html = fs.readFileSync('./scripts/zero_one_ep1_page.html', 'utf8');

const loadMatches = html.match(/muvipro_loadTabContent\([^)]+\)/g);
console.log('muvipro_loadTabContent matches:', loadMatches);

const onclicks = html.match(/onclick=['"][^'"]+['"]/g);
console.log('onclicks:', onclicks);

const tabs = html.match(/id=['"]muvipro_player_content_id['"]/g);
console.log('muvipro_player_content_id exists?:', tabs);

const playerSection = html.match(/<section class="gmp-player-card"[\s\S]*?<\/section>/i);
console.log('Player section:\n', playerSection ? playerSection[0] : 'None');




