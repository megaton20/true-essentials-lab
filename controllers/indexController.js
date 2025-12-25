const axios = require('axios');
const indexservices = require('../services/indexServices')
const {v4:uuidv4} = require('uuid');

// const { success } = require('../utils/fancyLogger');



exports.landingPage = async (req, res) => {


  try {
    
  const {userActive} = await indexservices.landingPage(req)
  const joinCommunityModal = !req.session.showJoinCommunity

    if (req.isAPI){
     return res.json({
        success:true,
        data: {userActive, joinCommunityModal}
      })
    }

        res.render('index', {
            joinCommunityModal,
            userActive
        })

  } catch (error) {
    console.error(`Error fetching landing: ${error}`);
    req.flash('error_msg', 'An error occurred');
    return res.redirect('/');
  }
}


exports.termsPage = async (req, res) => {


  try {
    
  const {userActive} = await indexservices.termsPage(req)

    if (req.isAPI){
     return res.json({
        success:true,
        data: {userActive}
      })
    }

        res.render('terms', {
            userActive
        })

  } catch (error) {
    console.error(`Error fetching read more: ${error}`);
    req.flash('error_msg', 'An error occurred ');
    return res.redirect('/');
  }
}

exports.readmorePage = async (req, res) => {


  try {
    
  const {userActive} = await indexservices.readmorePage(req)

    if (req.isAPI){
     return res.json({
        success:true,
        data: {userActive}
      })
    }

        res.render('read-more', {
            userActive
        })

  } catch (error) {
    console.error(`Error fetching read more: ${error}`);
    req.flash('error_msg', 'An error occurred ');
    return res.redirect('/');
  }
}

exports.affiliateInfoPage = async (req, res) => {


  try {
    
  const {userActive} = await indexservices.affiliateInfoPage(req)

    if (req.isAPI){
     return res.json({
        success:true,
        data: {userActive}
      })
    }

        res.render('affiliate', {
            userActive
        })

  } catch (error) {
    console.error(`Error fetching read more: ${error}`);
    req.flash('error_msg', 'An error occurred ');
    return res.redirect('/');
  }
}
exports.affiliateTermsPage = async (req, res) => {

  try {
    
  const {userActive} = await indexservices.affiliateTermsPage(req)

    if (req.isAPI){
     return res.json({
        success:true,
        data: {userActive}
      })
    }

        res.render('affiliate-terms', {
            userActive
        })

  } catch (error) {
    console.error(`Error fetching read more: ${error}`);
    req.flash('error_msg', 'An error occurred ');
    return res.redirect('/');
  }
}