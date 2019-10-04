ipfs=new Ipfs({
	EXPERIMENTAL:{pubsub: true},
	preload:{enabled:false},
	relay: { enabled: true, hop: { enabled: true, active: true } },
	config: {
		Addresses: {
			Swarm: ['/dns4/ws-star.discovery.libp2p.io/tcp/443/wss/p2p-websocket-star']
			}
		}
	});
ipfs.on('ready', async () => {
	orbitdb = await orbitDb.createInstance(ipfs)
	chan.oninit()
	try{
		db2=await orbitdb.keyvalue("kopichan-db",{accessController:{write: ['*']}});
		await db2.load();
		chan.db = await orbitdb.keyvalue("/orbitdb/zdpuAqiF3tf8ZKWSX2yHtsdwh4FteZMJUvfhnrkGgZvroz9iw/kopichan-db",{accessController:{write: ['*']}});
		await chan.db.load();
		chan.db.events.on('replicated', chan.onreplicated);
		chan.db.events.on('replicate', chan.onreplicate);
		chan.db.events.on('replicate.progress', chan.onprogress);
		chan.db.events.on('peer', function(){console.log("NEw PeEr!")});
		Verificate(db2,chan.db);
		//chan.my=await orbitdb.keyvalue("kopichan-my",{accessController:{write: [orbitdb.identity.publicKey]}})
		}
		catch(e){console.log(e)}
		chan.oninitend()
});
chan={
	db:[],
	//TODO: TagWiki
	tagwiki:[],
	//TODO: my and favs
	my:[],
	oninit:function(){},
	oninitend:function(){},
	oncontentcreate:function(){},
	oncontentcreated:function(){},
	onerror:function(){},
	onreplicated:function(){},
	onreplicate:function(){},
	onprogress:function(){},
	create:function(file,tags,opt)
	{
		chan.oncontentcreate();
		if(file.constructor!=File){throw Error("First argument is not File")}
		if(tags.constructor!=Array){throw Error("First argument is not Array")}
		if(file.type!="")
		{
			var mime=file.type
			tags.push("mime:"+file.type);
			tags.push("type:"+file.type.split("/")[0]);
		}
		tags.push("file_name:"+file.name.replace(" ","_"));
		var file_name=file.name;
		tags.push("file_ex:"+file.name.split(".")[file.name.split(".").length-1]);
		var date=new Date();
		var strdat=date.toUTCString()
		tags.push(`date:${date.getDay()}/${date.getMonth()}/${date.getYear()}`);
		tags.push(`time:${date.getHours()};${date.getMinutes()}`);
		tags.push(`size:${Math.floor(file.size/1024)}Kb`)
		ipfs.add(file,function(err,data){
			if(err){throw Error(err)}
			//chan.my.put(data[0].hash,{hash:data[0].hash,tags:tags});
			if(opt.preview)
			{
				ipfs.add(new File([opt.preview],"",{type:opt.preview.type}),function(err,previewhash){
					if(err){throw Error(err)}
					chan.db.put(data[0].hash,{hash:data[0].hash,tags:tags,preview:previewhash[0].hash,mime:mime,file_name:file_name,type:"file"}).then(function(){chan.oncontentcreated(chan.db.all[data[0].hash])});
				})
			}
			else
			{
				chan.db.put(data[0].hash,{hash:data[0].hash,tags:tags,mime:mime,file_name:file_name,type:"file"}).then(function(){chan.oncontentcreated(chan.db.all[data[0].hash])});
			}
		})
	},
	createDir:function(files,name,tags,previews)
	{
		console.log(files,name,tags,previews);
		//if(file.constructor!=FileList){throw Error("First argument is not File")}
		if(tags.constructor!=Array){throw Error("argument is not Array")}
		if(name.constructor!=String){throw Error("First argument is not Array")}
		var date=new Date();
		var strdat=date.toUTCString()
		tags.push(`date:${date.getDay()}/${date.getMonth()}/${date.getYear()}`);
		tags.push(`time:${date.getHours()};${date.getMinutes()}`);
		var hashs=[];
		var pvs=[];
		async function getttt(){
		for(let file of files)
		{
			await ipfs.add(file).then(function(data){hashs.push({hash:data[0].hash,mime:file.type,name:file.name});})
		}
		for(let pv of previews)
		{
			await ipfs.add(new File([pv],"",{type:"image/png"})).then(function(data){pvs.push(data[0].hash);})
		}
		}
		getttt().then(function(){
			chan.db.put(name,{name:name,hash:hashs,tags:tags,preview:pvs,type:"dir"}).then(function(){chan.oncontentcreated(name)});
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
		for(let i of str)
		{
			switch(i)
			{
				case " ":res.push(token);token="";res.push("&&");break;
				case "-":res.push("!");break;
				case "|":res.push(token);token="";res.push("||");break;
				case "(":res.push("(");break;
				case ")":res.push(token);token="";res.push(")");break;
				default:token+=i;
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
				default:result+="chan.db.all[content].tags.includes('"+i+"')";
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
			for(content in chan.db.all)
			{
				if(eval(cond))
				{
					result.push(chan.db.all[content])
				}
			}
		}
		return result;
		}
		else
		{
			return chan.db.all
		}
	},
	getFile:function(content,func,index)
	{
		if(content.type=="file")
		{
		ipfs.get(content.hash,function(err,data){
			if(err){chan.onerror(err)}
			let file=new File([data[0].content],content.file_name,{type:content.mime});
			let fr=new FileReader()
			fr.onload=function()
			{
				func(fr.result);
			}
			fr.readAsDataURL(file);
		})
		}
		else if(content.type=="dir")
		{
			ipfs.get(content.hash[index].hash,function(err,data){
			if(err){chan.onerror(err)}
			let file=new File([data[0].content],content.preview[index].name,{type:content.preview[index].mime});
			let fr=new FileReader()
			fr.onload=function()
			{
				func(fr.result);
			}
			fr.readAsDataURL(file);
		})
		}
	},
	getPreview:function(content,func,index)
	{
		if(content.type=="file")
		{
		ipfs.get(content.preview,function(err,data){
			if(err){chan.onerror(err)}
			let file=new File([data[0].content],content.file_name,{type:content.mime});
			let fr=new FileReader()
			fr.onload=function()
			{
				func(fr.result);
			}
			fr.readAsDataURL(file);
		})
		}
		else if(content.type=="dir")
		{
			ipfs.get(content.preview[index],function(err,data){
			if(err){chan.onerror(err)}
			let file=new File([data[0].content],content.preview[index].name,{type:content.preview[index].mime});
			let fr=new FileReader()
			fr.onload=function()
			{
				func(fr.result);
			}
			fr.readAsDataURL(file);
		})
		}
	},
	getMediaStream:function(hash)
	{
		
	}
}
ipfs.on('error',chan.onerror)
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