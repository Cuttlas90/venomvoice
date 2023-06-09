'use strict';
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    nickname: DataTypes.STRING,
    status: 'integer',
    venomAddress: DataTypes.STRING,
    nonce: DataTypes.STRING,
    createDateTime: 'timestamp with time zone',
  }, {timestamps:false,tableName:'user'});
  User.associate = function(models) {
    // associations can be defined here
  };
  return User;
};
