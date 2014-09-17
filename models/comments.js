var mongodb = require('./db');

function Comment(name,day,title,comment){
	this.name = name;
	this.day = day;
	this.title = title;
	this.comment = comment;
}

module.exports = Comment;

//存储留言
Comment.prototype.save = function save(callback){
	var name = this.name;
	var day = this.day;
	var title =this.title;
	var comment = this.comment;
	//打开数据库
	mongodb.open(function(err,db){
		if(err){
			return callback(err);
		}
		//读取posts集合
		db.collection('posts',function(err,collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			//通过用户名，日期，文章标题将一个留言插入到文章里
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