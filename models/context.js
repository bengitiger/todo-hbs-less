'use strict';
module.exports = function(sequelize, DataTypes) {
  var Context = sequelize.define('Context', {
    name: DataTypes.STRING
  }, {
    classMethods: {
      associate: function(models) {
				Context.hasMany(models.Item)
        Context.belongsTo(models.User, {foreignKey: 'UserId', onDelete: 'CASCADE'});
        // associations can be defined here
      }
    }
  });
  return Context;
};
