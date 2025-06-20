const fs = require('fs');
const path = require('path');

async function initAllModels() {
  const modelDir = path.join(__dirname, 'models');

  // Step 1: Manually initialize Season and User
  const Season = require('./models/Season.js');
  const User = require('./models/User.js');
  const ClassSession = require('./models/ClassSession.js');
  const Course = require('./models/Course.js');
  

  if (typeof Season.init === 'function') await Season.init();
  if (typeof User.init === 'function') await User.init();
  if (typeof Course.init === 'function') await Course.init();
  if (typeof ClassSession.init === 'function') await ClassSession.init();

  // Step 2: Load all other models excluding Season.js and User.js
  const modelFiles = fs.readdirSync(modelDir).filter(file =>
    !['Season.js', 'User.js','Course.js', 'ClassSession.js'].includes(file)
  );

  for (const file of modelFiles) {
    const Model = require(`./models/${file}`);
    if (typeof Model.init === 'function') {
      await Model.init();
    }
  }
}



module.exports = initAllModels;
