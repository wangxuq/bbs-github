var mongodb = require('./db');

function Comment(name,day,title,comment){
	this.name = name;
	this.day = day;
	this.title = title;
	this.comment = comment;
}

module.exports = Comment;

//�洢����
Comment.prototype.save = function save(callback){
	var name = this.name;
	var day = this.day;
	var title =this.title;
	var comment = this.comment;
	//�����ݿ�
	mongodb.open(function(err,db){
		if(err){
			return callback(err);
		}
		//��ȡposts����
		db.collection('posts',function(err,collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			//ͨ���û��������ڣ����±��⽫һ�����Բ��뵽������
			collection.update({
				"name" : name,
				"time.day" : day,
				"title" : title
			},{
				$push : {"comments" : comment}
			},function(err,result){
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null);
			});
		});
	});
};