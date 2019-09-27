ipfs=new Ipfs({
	EXPERIMENTAL:{pubsub: true}, 
	config: {
		Addresses: {
			Swarm: ['/dns4/ws-star.discovery.libp2p.io/tcp/443/wss/p2p-websocket-star']
			}
		}
	});
ipfs.on('ready', async () => {
	orbitdb = await orbitDb.createInstance(ipfs)
	try{
		db2=await orbitdb.keyvalue("kopichan-db",{accessController:{write: ['*']}});
		await db2.load();
		chan.db = await orbitdb.keyvalue("/orbitdb/zdpuAqiF3tf8ZKWSX2yHtsdwh4FteZMJUvfhnrkGgZvroz9iw/kopichan-db",{accessController:{write: ['*']}});
		await chan.db.load();
		Verificate(db2,chan.db);
		//chan.my=await orbitdb.keyvalue("kopichan-my",{accessController:{write: [orbitdb.identity.publicKey]}})
		}
		catch(e){console.log(e)}
		ui.window.loading.hide()
		ui.mansory.render(chan.db.all);
});
ipfs.on('error', function(e){ui.window.error.show(e);console.error(e)})
chan={
	db:[],
	tagwiki:[],
	my:[],
	create:function(file,tags,preview)
	{
		if(file.constructor!=File){throw Error("First argument is not File")}
		if(tags.constructor!=Array){throw Error("First argument is not Array")}
		if(file.type!="")
		{
			tags.push("mime:"+file.type);
			tags.push("type:"+file.type.split("/")[0]);
		}
		tags.push("file_name:"+file.name.replace(" ","_"));
		tags.push("file_ex:"+file.name.split(".")[file.name.split(".").length-1]);
		var date=new Date();
		tags.push(`date:${date.getDay()}/${date.getMonth()}/${date.getYear()}`);
		tags.push(`time:${date.getHours()};${date.getMinutes()}`);
		ipfs.add(file,function(err,data){
			if(err){throw Error(err)}
			//chan.my.put(data[0].hash,{hash:data[0].hash,tags:tags});
			if(preview)
			{
					console.log(preview)
				ipfs.add(new File([preview],"",{type:preview.type}),function(err,previewhash){
					if(err){throw Error(err)}
					chan.db.put(data[0].hash,{hash:data[0].hash,tags:tags,preview:previewhash[0].hash}).then(function(){ui.mansory.render(chan.db.all);});
				})
			}
			else
			{
				chan.db.put(data[0].hash,{hash:data[0].hash,tags:tags}).then(function(){ui.mansory.render(chan.db.all);});
			}
		})
	},
	edit:function(content){
		chan.db.set(content.hash,content);
	},
	getPrefix:function(content,prefix)
	{
		for(let tag of content.tags)
		{
			if(tag.split(":")[0]==prefix)
			{
				return tag.split(":")[1];
			}
		}
	},
	tagParse:function(str)
	{
		var res=[];
		var token="";
		for(let i in str)
		{
			switch(str[i])
			{
				case " ":res.push(token);token="";res.push("&&");break;
				case "-":res.push("!");break;
				case "|":res.push(token);token="";res.push("||");break;
				case "(":res.push("(");break;
				case ")":res.push(token);token="";res.push(")");break;
				default:token+=str[i];
			}
		}
		res.push(token);
		var result=""
		for(let i of res)
		{
			switch(i)
			{
				case "":break;
				case "&&":result+="&&";break;
				case "!":result+="!";break;
				case "||":result+="||";break;
				case "(":result+="(";break;
				case ")":result+=")";break;
				default:result+="content.tags.includes('"+i+"')";
			}
		}
		return result;
	},
	search:function(str)
	{
		if(str!="")
		{
		var cond=chan.tagParse(str)
		result=[];
		if(str.split(" ").includes(":my")||str.split(" ").includes(":fav"))
		{
			for(content of chan.my.all)
			{
				if(eval(cond))
				{
					result.push(content)
				}
			}
		}
		else
		{
			for(content of chan.db.all)
			{
				if(eval(cond))
				{
					result.push(content)
				}
			}
		}
		return result;
		}
		else
		{
			return chan.db.all
		}
	}
}
function Verificate(db1,db2)
{
	for(var i in db1.all)
	{
		if(!db2[i])
		{
			db2.put(i,db1.all[i])
		}
	}
}