const fs = require('fs');
const path = require('path');

async function initAllModels() {
  const modelFiles = fs.readdirSync(path.join(__dirname, 'models'));

  for (const file of modelFiles) {
    const Model = require(`./models/${file}`);
    if (typeof Model.init === 'function') {
      await Model.init();
    }
  }
}

module.exports = initAllModels;
