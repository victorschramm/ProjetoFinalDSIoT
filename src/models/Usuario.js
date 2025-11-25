const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcrypt');
const NivelAcesso = require('./NivelAcesso');

const Usuario = sequelize.define('Usuario', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: {
        args: [2, 100],
        msg: 'O nome deve ter entre 2 e 100 caracteres'
      }
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: {
      msg: 'Este email já está em uso'
    },
    validate: {
      isEmail: {
        msg: 'Email inválido'
      },
      notEmpty: {
        msg: 'O email é obrigatório'
      }
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: {
        args: [6, 100],
        msg: 'A senha deve ter no mínimo 6 caracteres'
      },
      notEmpty: {
        msg: 'A senha é obrigatória'
      }
    }
  },
  tipo_usuario: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: {
        args: [['admin', 'usuario']],
        msg: 'Tipo de usuário deve ser admin ou usuario'
      }
    }
  }  
}, {
  tableName: 'Usuarios',
  hooks: { 
    beforeCreate: async (usuario) => {
      const salt = await bcrypt.genSalt(10);
      usuario.password = await bcrypt.hash(usuario.password, salt);
    }
  }
});

Usuario.belongsTo(NivelAcesso, {
  foreignKey: 'id_nivel_acesso',
  as: 'nivel_acesso'
});


Usuario.prototype.checkPassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = Usuario;
