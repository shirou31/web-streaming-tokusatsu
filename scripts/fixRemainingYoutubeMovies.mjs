import fs from 'fs';

const filePath = 'src/data/scrapedTokusatsu.json';
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const m1 = data.episodes.find(e => e.id === 'scraped_prod_kamen-rider-den-o-im-born_movie');
if (m1) {
  m1.driveDownloadUrl1 = 'https://drive.google.com/file/d/1VlCikk1rorU77lezkhe6ZdKCTqPaoZeS/view?usp=sharing';
  m1.driveDownloadUrl2 = 'https://drive.google.com/file/d/1KWkpRLlntPufqqrKDRJidr7d2Kr8cTRM/view?usp=sharing';
  m1.servers = [
    {
      id: `srv_real_drive_1_${m1.id}`,
      name: 'Server 1 (Google Drive Direct HD / 1440p)',
      embedUrl: 'https://drive.google.com/file/d/1VlCikk1rorU77lezkhe6ZdKCTqPaoZeS/preview',
      directUrl: 'https://drive.google.com/file/d/1VlCikk1rorU77lezkhe6ZdKCTqPaoZeS/view?usp=sharing',
      type: 'gdrive',
      status: 'online'
    },
    {
      id: `srv_real_drive_2_${m1.id}`,
      name: 'Server 2 (Mirror Direct HD / 1440p)',
      embedUrl: 'https://drive.google.com/file/d/1KWkpRLlntPufqqrKDRJidr7d2Kr8cTRM/preview',
      directUrl: 'https://drive.google.com/file/d/1KWkpRLlntPufqqrKDRJidr7d2Kr8cTRM/view?usp=sharing',
      type: 'gdrive',
      status: 'online'
    }
  ];
}

const m2 = data.episodes.find(e => e.id === 'scraped_prod_cho-kamen-rider-den-o-decade-onigashima_movie');
if (m2) {
  m2.driveDownloadUrl1 = 'https://drive.google.com/file/d/1EBMLE7daELdHZU8q-l5gFcdoSTWTCu8D/view?usp=sharing';
  m2.driveDownloadUrl2 = 'https://drive.google.com/file/d/1aDQ5tDx36OBskAL5dxww8kD5O-n5_bxe/view?usp=sharing';
  m2.servers = [
    {
      id: `srv_real_drive_1_${m2.id}`,
      name: 'Server 1 (Google Drive Direct HD / 1440p)',
      embedUrl: 'https://drive.google.com/file/d/1EBMLE7daELdHZU8q-l5gFcdoSTWTCu8D/preview',
      directUrl: 'https://drive.google.com/file/d/1EBMLE7daELdHZU8q-l5gFcdoSTWTCu8D/view?usp=sharing',
      type: 'gdrive',
      status: 'online'
    },
    {
      id: `srv_real_drive_2_${m2.id}`,
      name: 'Server 2 (Mirror Direct HD / 1440p)',
      embedUrl: 'https://drive.google.com/file/d/1aDQ5tDx36OBskAL5dxww8kD5O-n5_bxe/preview',
      directUrl: 'https://drive.google.com/file/d/1aDQ5tDx36OBskAL5dxww8kD5O-n5_bxe/view?usp=sharing',
      type: 'gdrive',
      status: 'online'
    }
  ];
}

const m3 = data.episodes.find(e => e.id === 'scraped_prod_kamen-rider-x-super-sentai-super-hero-taisen_movie');
if (m3) {
  m3.driveDownloadUrl1 = 'https://drive.google.com/file/d/1xy5ZSUWI4xeRkYJ3W2p4YvN5Q_7F6r-j/view?usp=sharing';
  m3.driveDownloadUrl2 = 'https://drive.google.com/file/d/10jf4f-gUslLgUom50hQoGqj_UoH81j9O/view?usp=sharing';
  m3.servers = [
    {
      id: `srv_real_drive_1_${m3.id}`,
      name: 'Server 1 (Google Drive Direct HD / 1440p)',
      embedUrl: 'https://drive.google.com/file/d/1xy5ZSUWI4xeRkYJ3W2p4YvN5Q_7F6r-j/preview',
      directUrl: 'https://drive.google.com/file/d/1xy5ZSUWI4xeRkYJ3W2p4YvN5Q_7F6r-j/view?usp=sharing',
      type: 'gdrive',
      status: 'online'
    },
    {
      id: `srv_real_drive_2_${m3.id}`,
      name: 'Server 2 (Mirror Direct HD / 1440p)',
      embedUrl: 'https://drive.google.com/file/d/10jf4f-gUslLgUom50hQoGqj_UoH81j9O/preview',
      directUrl: 'https://drive.google.com/file/d/10jf4f-gUslLgUom50hQoGqj_UoH81j9O/view?usp=sharing',
      type: 'gdrive',
      status: 'online'
    }
  ];
}

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('Updated the 3 YouTube movies to Google Drive permanent servers!');
