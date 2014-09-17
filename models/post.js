var mongodb = require('./db');
var markdown = require('markdown').markdown;

function Post(name,head,title,tags,post){
	this.name = name;
	this.head = head;
	this.title = title;
	this.tags = tags;
	this.post = post;
}
module.exports = Post;

//将一篇文章存入数据库
Post.prototype.save = function save(callback){
	var date = new Date();
	var time = {
		date : date,
		year : date.getFullYear(),
		month : date.getFullYear()+'-'+(date.getMonth()+1),
		day : date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate(),
		hour : date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate()+'-'+date.getHours(),
		minute : date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate()+' '+date.getHours()+':'+date.getMinutes()
	};
	//存入数据库的post集合
	var post = {
		name : this.name,
		head : this.head,
		time : time,
		title : this.title,
		tags : this.tags,
		post : this.post,
		comments : [],
		pv : 0
	};
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
			collection.insert(post,{safe:true},function(err,post){
				mongodb.close();
				if(err){
					return callback(err);
				}
				return callback(null);
			});
		});
	});
};
//获取所有文章的有关信息
Post.get = function(name,callback){
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
			var query = {};
			if(name){
				query.name = name;
			}
			//以query对象查询文章
			collection.find(query).sort({time:-1}).toArray(function(err,docs){
				mongodb.close();
				if(err){
					return callback(err);
				}		
				docs.forEach(function(doc){
					doc.post = markdown.toHTML(doc.post);
				});
				callback(null,docs);//成功，以数组形式返回
			});
		});
	});
};
//获取一篇文章的准确信息
Post.getOne = function(name,day,title,callback){
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
			//封装查询条件
			collection.findOne({
				"name" : name,
				"time.day" : day,
				"title" : title
			},function(err,doc){
				mongodb.close();
				if(err){
					return callback("error",err);
				}
				//封装markdown为html
				if(doc){
					doc.post = markdown.toHTML(doc.post);
				}
				return callback(null,doc);
			});
			
			//每获取一次文章，其阅读量pv增加1
			collection.update({
				"name" : name ,
				"time.day" : day,
				"title" : title
			},{
				$inc : {'pv' : 1}
			},function(err,res){
				mongodb.close();
				if(err){
					return callback(err);
				}
			});
		});
	});
};
//获取一篇文章的原文
Post.edit = function edit(name,day,title,callback){
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
			collection.findOne({
				"name" : name,
				"time.day" : day,
				"title" : title
			},function(err,doc){
				mongodb.close();
				if(err){
					return callback(err);
				}
				return callback(null,doc);
			});
		});
	});
};
//更新一篇文章
Post.update = function update(name,day,title,post,callback){
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
			collection.update({
				"name" : name,
				"time.day" : day,
				"title" : title
			},{
				$set : {"post" : post}
			},function(err){
				mongodb.close();
				if(err){
					return callback(err);
				}
				return callback(null);
			});
		});
	});
};
//删除一篇文章
Post.remove = function remove(name,day,title,callback){
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
			collection.remove({
				"name" : name,
				"time.day" : day,
				"title" : title
			},function(err){
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null);
			});
		});
	});
};
//获取所有的标签
Post.getTags = function getTags(callback){
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
			//使用distinct防止重复显示标签
			collection.distinct('tags.tag',function(err,docs){
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null,docs);
			});
		});
	});
};
//通过特定标签查找相关文章
Post.getTag = function getTag(tag,callback){
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
			collection.find({
				'tags.tag':tag
			},{
				'name': 1,
				'time' : 1,
				'title': 1
			}).sort({
				time : -1
				}).toArray(function(err,docs){
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null,docs);
			});
		});
	});
};
//获取所有文章的存档
Post.getArchive = function getArchive(callback){
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
			//获取所有文章的存档
			collection.find({},{
				'name' : 1,
				'time' : 1,
				'title' : 1
			}).sort({
				time:-1
			}).toArray(function(err,docs){
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null,docs);
			});
		});
	});
};
//根据关键字搜索
Post.search = function search(keyword,callback){
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
			var pattern = new RegExp("^.*"+keyword+".*$","i");
			collection.find({
				title : pattern,
			},{
				"name" : 1,
				"time": 1,
				"title" : 1
			}).sort({time : -1}).toArray(function(err,docs){
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null,docs);
			});
		});
	});
}