'use strict';
module.exports = (sequelize, DataTypes) => {
  const Transactions = sequelize.define('Transactions', {
    from: DataTypes.STRING,
    to: DataTypes.STRING,
    transactionHash: DataTypes.STRING,
    createDateTime: 'timestamp with time zone',
  }, {timestamps:false,tableName:'transactions'});
  Transactions.associate = function(models) {
    // associations can be defined here
  };
  return Transactions;
};
