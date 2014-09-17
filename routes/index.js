var crypto = require('crypto');
var User = require('../models/user.js');
var Post = require('../models/post.js');
var Comment = require('../models/comments.js');
var passport = require('passport');

module.exports = function(app){
	app.get('/',function(req,res){
		Post.get(null,function(err,posts){
			if(err){
				posts = [];
			}
			res.render('index',{
				title : 'index',
				user : req.session.user,
				posts : posts,
				success : req.flash('success').toString(),
				error : req.flash('error').toString()
			});
		});
	});
	
	//注册获取
	app.get('/reg',checkNotLogin);
	app.get('/reg',function(req,res){
		res.render('reg',{
			title : 'register',
			user : req.session.user,
			success : req.flash('success').toString(),
			error : req.flash('error').toString()
		});
	});
	
	//注册提交
	app.post('/reg',checkNotLogin);
	app.post('/reg',function(req,res){
		//检测两次输入密码是否一致
		if(req.body['repassword'] != req.body.password){
			req.flash('error','password is not consistent');
			return  res.redirect('/reg');
		}
		//加密密码
		var md5 = crypto.createHash('md5');
		var password = md5.update(req.body.password).digest('base64');
		
		var newUser = new User({
			name : req.body.name,
			password : password,
			email : req.body.email
		});
		//检查用户名是否已经存在
		User.get(newUser.name,function(err,user){
			if(user){
				req.flash('error','username has been exists');
				return res.redirect('/reg');
			}
			newUser.save(function(err,user){
				if(err){
					req.flash('error',err);
					return res.redirect('/reg');
				}
				req.session.user = user;
				req.flash('success','register successfully');
				return res.redirect('/');
			});
		});
	});
	
	//登录获取
	app.get('/login',checkNotLogin);
	app.get('/login',function(req,res){
		res.render('login',{
			title :'login',
			user : req.session.user,
			success : req.flash('success').toString(),
			error : req.flash('error').toString()
		});
	});

	//登录提交
	app.post('/login',checkNotLogin);
	app.post('/login',function(req,res){
		var md5 = crypto.createHash('md5');
		var password = md5.update(req.body.password).digest('base64');
		User.get(req.body.name,function(err,user){
			//检查用户名是否已经存在
			if(!user){
				req.flash('error','用户名不存在');
				return res.redirect('/login');
			}
			//检查密码是否正确
			if(user.password != password){
				req.flash('error','密码有误');
				return res.redirect('/login');
			}
			//如果正确,将信息存入session
			req.session.user = user ;
			req.flash('success','登录成功');
			res.redirect('/');
		});
	});
	//github login
	app.get('/login/github',passport.authenticate("github",{session:false}));
	app.get('/login/github/callback',passport.authenticate("github",{
			session:false,
			failureRedirect : './login',
			successFlash : "login successfully"
		}),function(req,res){
			req.session.user ={name : req.user.username,head:"https://gravatar.com/avatar/"+req.user._json.gravatar_id+"?s=60"};
			res.redirect('/');
		}
	);
    //qq  login
	/*
	app.get('/login/qq',checkNotLogin);
	app.get('/auth/qq/callback', passport.authenticate('qq', {
			failureRedirect: './login',
			session : false,
			successFlash : "login successfully"
		}),function(req, res) {
			// Successful authentication, redirect home.
			res.redirect('/');
		}
	);
	*/
	//获取发表文章的文章表格
	app.get('/post',checkLogin);
	app.get('/post',function(req,res){
		res.render('post',{
			title : '发表文章',
			user :req.session.user,
			success : req.flash('success').toString(),
			error : req.flash('error').toString()
		});
	});
	//获取所有文章
	app.post('/post',checkLogin);
	app.post('/post',function(req,res){
		var currUser = req.session.user;
		var tags = [{"tag":req.body.tag1},{"tag":req.body.tag2},{"tag":req.body.tag3}];
		var post = new Post(currUser.name,currUser.head,req.body.title,tags,req.body.post);
		post.save(function(err){
			if(err){
				req.flash('error','err');
				return res.redirect('/');
			}
			req.flash('success','发表成功');
			return res.redirect('/');
		});
	});
	
	//登出系统
	app.get('/logout',checkLogin);
	app.get('/logout',function(req,res){
		req.session.user = null;
		success : req.flash('success','logout successfully');
		return res.redirect('/');
	});
	app.get('/u/:name/:day/:title',checkLogin);
	//获取一篇文章的准确信息（根据用户名、时间、标题）
	app.get('/u/:name/:day/:title',function(req,res){
		Post.getOne(req.params.name,req.params.day,req.params.title,function(err,post){
			if(err){
				req.flash('error',err);
				return res.redirect('/');
			}
			res.render('article',{
				title : req.params.title,
				post : post,
				user :req.session.user,
				success : req.flash('success').toString(),
				error : req.flash('error').toString()
			});
		});
	});
	
	//存储留言
	app.post('/u/:name/:day/:title',checkLogin);
	app.post('/u/:name/:day/:title',function(req,res){
		var date = new Date();
		var time = date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate()+' '+date.getHours()+':'+date.getMinutes();
		var md5 = crypto.createHash('md5');
		var email_md = md5.update(req.body.email.toLowerCase()).digest('hex');
		var head = "http://www.gravatar.com/avatar/"+email_md+"?s=40";
		var comment = {
			name : req.body.name,
			head : head,
			email : req.body.email,
			website : req.body.website,
			time : time,
			content : req.body.content
		}
		var newComment = new Comment(req.params.name,req.params.day,req.params.title,comment);
		newComment.save(function(err){
			if(err){
				req.flash('error','留言失败');
				return res.redirect('/');
			}
			req.flash('success','留言成功');
			return res.redirect('back');
		});
	});
	//删除留言
	app.get('/remove/:name/:day/:title',checkLogin);
	app.get('/remove/:name/:day/:title',function(req,res){
		var currentUser = req.session.user;
		Post.remove(req.params.name,req.params.day,req.params.title,function(err){
			if(err){
				req.flash('error','删除失败');
				return res.redirect('/');
			}
			req.flash('success','删除成功');
			return res.redirect('/');
		});
	});
	//获取编辑文章并获取所要编辑的文章信息
	app.get('/edit/:name/:day/:title',checkLogin);
	app.get('/edit/:name/:day/:title',function(req,res){
		var currentUser = req.session.user;
		Post.edit(currentUser.name,req.params.day,req.params.title,function(err,post){
			if(err){
				req.flash('error',err);
				return res.redirect('back');
			}
			res.render('edit',{
				title : req.params.title,
				post : post,
				user : req.session.user,
				success : req.flash('success').toString(),
				error : req.flash('error').toString()
			})
		});
	});
	//更新文章,提交编辑页面
	app.post('/edit/:name/:day/:title',checkLogin);
	app.post('/edit/:name/:day/:title',function(req,res){
		var currentUser = req.session.user;
		Post.update(currentUser.name,req.params.day,req.params.title,req.body.post,function(err){
			var url = "/u/"+req.params.name+"/"+req.params.day+"/"+req.params.title;
			if(err){
				req.flash('error','更新失败');
				return res.redirect('/');
			}
			req.flash('success','更新成功');
			return res.redirect(url);
		});
	});
	//返回一个用户的所有文章
	app.get('/u/:name',function(req,res){
		User.get(req.params.name,function(err,user){
			if(!user){
				req.flash('error','该用户不存在');
				return res.redirect('/');
			}
			Post.get(user.name,function(err,posts){
				if(err){
					req.flash('error',err);
					return res.redirect('/');
				}
				res.render('user',{
					title : user.name,
					user : req.session.user,
					posts : posts,
					post : posts.post,
					success : req.flash('success').toString(),
					error : req.flash('error').toString()
				});
			});
		});
	});
	//获取所有文章的标签
	app.get('/tags',function(req,res){
		Post.getTags(function(err,posts){
			if(err){
				req.flash('error',err);
				return res.redirect('/');
			}
			res.render('tags',{
				title : 'tags',
				user : req.session.user,
				posts : posts,
				success : req.flash('success').toString(),
				error : req.flash('error').toString()
			});
		});
	});
	//获取特定标签的所有文章
	app.get('/tags/:tag',function(req,res){
		Post.getTag(req.params.tag,function(err,posts){
			if(err){
				req.flash('error',err);
				return res.redirect('/');
			}
			res.render('tag',{
				title : req.params.tag,
				posts : posts,
				user : req.session.user,
				success : req.flash('success').toString(),
				error : req.flash('error').toString()
			});
		});
	});
	//获取所有文章的存档
	app.get('/archive',function(req,res){
		Post.getArchive(function(err,posts){
			if(err){
				req.flash('error','获取存档失败');
			}
			res.render('archive',{
				title : 'archive',
				posts : posts,
				user : req.session.user,
				success : req.flash('success').toString(),
				error : req.flash('error').toString()
			});
		});
	});
	//根据关键字获取文章信息
	app.get('/search',function(req,res){
		Post.search(req.query.keyword,function(err,posts){
			if(err){
				req.flash('error',err);
				return res.redirect('/');
			}
			res.render('search',{
				title : req.query.keyword,
				user : req.session.user,
				posts : posts,
				success : req.flash('success').toString(),
				error : req.flash('success').toString()
			});
		});
	});
	function checkLogin(req,res,next){
		if(!req.session.user){
			req.flash('error','用户未登录');
			return res.redirect('/login');
		}
		next();
	};
	function checkNotLogin(req,res,next){
		if(req.session.user){
			req.flash('error','用户已经存在');
			return res.redirect('back');
		}
		next();
	};
}

