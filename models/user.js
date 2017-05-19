'use strict';
var config = require('../config/config.js')[process.env.NODE_ENV];

const crypto = require('crypto');

module.exports = function(sequelize, DataTypes) {
  var User = sequelize.define('user', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    username: {
      type: DataTypes.STRING,
      unique: true,
      validate: {
        len: {
          args: [3,20],
          msg: 'Username must be between 3 and 20 characters'
        },
        isAlphanumeric: {msg: 'Username must be alphanumeric'}
      }
    },
    password: {
      type: DataTypes.STRING(64),
      validate: { 
        len: {
          args: [6,64],
          msg: 'Password must be at least 6 characters'
        }
      }
    },
    email: {
      type: DataTypes.STRING(64),
      validate: {
        isEmail: {msg: 'Email is not valid'}
      },
      unique: {msg: 'Email is already in use'}
    },
    firstname:{
      type: DataTypes.STRING(64),
      validate: { 
        len: {
          args: [1,32],
          msg: 'First name is required'
        }
      }
    },
    lastname:{
      type: DataTypes.STRING(64)
    },
    is_admin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    profile_text:{
      type: DataTypes.TEXT
    },
    profile_photo: {
      type: DataTypes.STRING(255)
    },
    max_negative_balance: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    underscored: true,
    //freezeTableName: true, // table name "user" conflicts with postgres user table
    classMethods: {
      /*associate: function(models) {
        
      },*/
      getIdByUsername: function(username){
        return User.findOne({
          attributes: ['id'],
          raw: true,
          where:{username:username}
        });
      },
      getByUsername: function(username){
        return User.findOne({
          where:{username: sequelize.where(sequelize.fn('LOWER', sequelize.col('username')),username.toLowerCase())}
        });
      },
      encryptPassword: function(pw){
        const hash = crypto.createHmac('sha256', config.salt)
                         .update(pw)
                         .digest('hex');
        return hash;
      },
      getUsersWithBalance: function(inactive,limit,offset){
        var q = "SELECT *, "
              + 'COUNT(users.id) OVER () AS total_entries, '
              + "(SELECT SUM(CASE WHEN sender_id=users.id THEN -1 * amount ELSE amount END) FROM ledger "
              + "WHERE sender_id=users.id OR receiver_id=users.id) AS balance "
              + "FROM users ";
        if (inactive){
          q += "WHERE is_active = false ";
        }
        q += 'ORDER BY username LIMIT :lmt OFFSET :offset';
        
        return sequelize.query( q,{ 
          replacements: {lmt:limit,offset:offset},
          type: sequelize.QueryTypes.SELECT 
        } );
      },
      searchUsers: function(term){
        var q = "SELECT * FROM users "
              + "WHERE LOWER(username) LIKE :term "
              + "OR LOWER(firstname) LIKE :term "
              + "OR LOWER(lastname) LIKE :term";

        return sequelize.query(q,{
          replacements: {term: '%' + term.toLowerCase() + '%'},
          type: sequelize.QueryTypes.SELECT
        });
      },
      getRecentUsers: function(limit){
        var limit = parseInt(limit);
        return User.findAll({
          limit: limit,
          order: [['created_at','DESC']]
        });
      }
    },
    instanceMethods: {
      verifyPassword: function(pw){
        const hash = crypto.createHmac('sha256', config.salt)
                           .update(pw)
                           .digest('hex');
        return hash == this.password;
      },
      isAdmin: function(){
        if (this.is_admin){
          return true;
        } else {
          return false;
        }
      },
      getBalance: function(){
        // SELECT SUM(CASE WHEN sender_id=1 THEN -1 * amount ELSE amount END) FROM ledger WHERE sender_id=1 OR receiver_id=1;
        var q = 'SELECT '
              + 'SUM(CASE WHEN sender_id=:id THEN -1 * amount ELSE amount END) '
              + 'AS balance '
              + 'FROM ledger WHERE sender_id=:id OR receiver_id=:id ';
        return sequelize.query(q,
          { replacements: {id:this.id}, type: sequelize.QueryTypes.SELECT }
        );
      },
      getSimpleLedger: function(limit){
        limit = parseInt(limit);
        var q = "SELECT to_char(ledger.transaction_timestamp, 'Mon FMDD, FMHH12: MI AM') AS formatted_date, "
              + 'ledger.*, u1.username AS sender, u2.username AS receiver, '
              + 'CASE '
              + " WHEN sender_id <> :id AND sender_id IS NOT NULL THEN CONCAT('From ', u1.username) "
              + " WHEN sender_id IS NULL THEN 'From BANK' "
              + " WHEN receiver_id <> :id THEN CONCAT ('To ',u2.username) "
              + 'END AS description, '
              + 'CASE WHEN sender_id = :id THEN -1 * amount ELSE amount END AS signed_amt '
              + 'FROM ledger '
              + 'LEFT JOIN users AS u1 ON u1.id = sender_id '
              + 'LEFT JOIN users AS u2 ON u2.id = receiver_id '
              + 'WHERE sender_id = :id OR receiver_id = :id '
              + 'ORDER BY transaction_timestamp DESC '
              + 'LIMIT :lmt';
        return sequelize.query(q,
          { replacements: {id:this.id,lmt:limit}, type: sequelize.QueryTypes.SELECT }
        );

      },
      getLedgerWithBalance: function(limit,offset){
        limit = parseInt(limit);
        offset = parseInt(offset);
        var q = "SELECT to_char(ledger.transaction_timestamp, 'Mon FMDD YYYY FMHH12: MI AM') AS formatted_date, "
              + 'COUNT(ledger.id) OVER () AS total_entries, '
              + 'ledger.*, u1.username AS sender, u2.username AS receiver, '
              + 'CASE '
              + " WHEN sender_id <> :id AND sender_id IS NOT NULL THEN CONCAT('From ', u1.username) "
              + " WHEN sender_id IS NULL THEN 'From BANK' "
              + " WHEN receiver_id <> :id THEN CONCAT ('To ',u2.username) "
              + 'END AS description, '
              + 'CASE WHEN sender_id = :id THEN -1 * amount ELSE amount END AS signed_amt, '
              + 'SUM(CASE WHEN sender_id = :id THEN -1 * amount ELSE amount END) '
              + 'OVER (ORDER BY ledger.transaction_timestamp) AS balance '
              + 'FROM ledger '
              + 'LEFT JOIN users AS u1 ON u1.id = sender_id '
              + 'LEFT JOIN users AS u2 ON u2.id = receiver_id '
              + 'WHERE sender_id = :id OR receiver_id = :id '
              + 'ORDER BY transaction_timestamp DESC';
        if (limit > 0){
          q += ' LIMIT :lmt';
        }
        if (offset > 0){
          q += ' OFFSET :offset';
        }
        return sequelize.query(q,
          { replacements: {id:this.id,lmt:limit,offset:offset}, type: sequelize.QueryTypes.SELECT }
        );
      }
    }
  });
  return User;
};