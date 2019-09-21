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
  db = await orbitdb.keyvalue("/orbitdb/zdpuAqiF3tf8ZKWSX2yHtsdwh4FteZMJUvfhnrkGgZvroz9iw/kopichan-db",{accessController:{write: ['*']}});
  await db.load()
  db2=await orbitdb.keyvalue("kopichan-db",{accessController:{write: ['*']}});
  await db2.load();
  Verificate(db2,db);
  }
  catch(e){console.log(e)}
  Mansory.contents=db.all;
});
ipfs.on('error', (e) => console.error(e))
chan={
	db:[],
	create:function(file,desc,tags)
	{
		if(file.constructor!=File){throw Error("First argument is not File")}
		if(desc.constructor!=String){throw Error("First argument is not String")}
		if(tags.constructor!=Array){throw Error("First argument is not Array")}
		if(file.type!="")
		{
			tags.push("mime:"+file.type);
			tags.push("type:"+file.type.split("/")[0]);
		}
		tags.push("file_name:"+file.name);
		tags.push("file_ex:"+file.name.split(".")[file.name.split(".").length-1]);
		ipfs.add(file,function(err,data){
			if(err){throw Error(err)}
			db.put(data[0].hash,{hash:data[0].hash,desc:desc,tags:tags});
		})
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
		for(content of db.all)
		{
			if(eval(cond))
			{
				result.push(content)
			}
		}
		return result;
		}
		else
		{
			return db.all
		}
	}
}
function DB2Arr(db)
{
	var arr=[]
	for(i in db)
	{
		arr.push(db[i])
	}
	return arr;
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