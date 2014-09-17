var mongodb = require('../models/db.js');
var crypto = require('crypto');

function User(user){
	this.name = user.name;
	this.password = user.password;
	this.email = user.email;
}

module.exports = User;

//�洢�û���Ϣ
User.prototype.save = function save(callback){
	var md5 = crypto.createHash('md5');
	var email_md5 = md5.update(this.email.toLowerCase()).digest('hex');
	var head = "http://www.gravatar.com/avatar/"+email_md5+"?s=60";
	
	var user ={
		name :this.name,
		password : this.password,
		email : this.email,
		head : head
	};
	
	//�����ݿ�
	mongodb.open(function(err,db){
		if(err){
			return callback(err);
		}
		//��ȡusers����
		db.collection('users',function(err,collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			collection.insert(user,{safe : true},function(err,user){
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null,user[0]);//�洢�û���Ϣ�ɹ������ص�ǰ�û���Ϣ
			});
		});
	});
};
User.get = function get(name,callback){
	//�����ݿ�
	mongodb.open(function(err,db){
		if(err){
			return callback(err);
		}
		//��ȡusers����
		db.collection('users',function(err,collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			//������Ϊname���û�
			collection.findOne({name:name},function(err,user){
				mongodb.close();
				if(user){
					return callback(null,user);
				}
				callback(err);
			});
		});
	});
}