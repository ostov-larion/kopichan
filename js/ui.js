ui={
	window:{
		content:{
			show:function(content,data)
			{
				ui.window.current=chan.db.all[content];
				console.log(content,ui.window.current);
				$("#desktop").css({display:"block"});
				$("#window").css({display:"block"});
				$("#window-dirfiles").html('');
				$("#window-title").html('');
				if(ui.window.current.type=="file")
				{
				if(ui.window.current.tags.includes('type:image'))
				{
					let $cur=ui.window.current;
					$("#window-content").html(`<center><img style="height:70%;width:auto;border-radius:4px;" src='${data}'></img></center>`);
					chan.getFile(ui.window.current,function(data){
						if(ui.window.current==$cur)
						{
						$("#window-content").html(`<center><img style="height:70%;width:auto;border-radius:4px;" src='${data}'></img></center>`)
						let img=$("#window-content").children("center")
						img[0].onmousewheel=function(e){
							console.log(e,this);
						}
						}
					})
				}
				else if(ui.window.current.tags.includes('type:audio'))
				{
					
				}
				else if(ui.window.current.tags.includes('type:video'))
				{
					chan.getFile(ui.window.current,function(data){
						$("#window-content").html(`<center><video style="width:80%;height:auto;" controls preload="metadata" src='${data}'></video></center>`);
					});
				}
				}
				else if(ui.window.current.type=="dir")
				{
					$("#window-title").html(content);
					ui.window.content.renderContent(0,data);
					for(let i in ui.window.current.preview)
					{
						chan.getPreview(ui.window.current,function(pv){
							$("#window-dirfiles").append(`<img src=${pv} style="height:8%;margin:3px" onclick="ui.window.content.renderContent(${i},'${pv}')"></img>`)
						},i)
					}
					
				}
				$("#window-tags").html("");
				$("#window-sys-tags").html("");
				for(var tag of ui.window.current.tags)
				{
					tag=tag.replace("<","&lt;").replace(">","&gt;");
					console.log(tag.indexOf("date:"))
					if(tag.indexOf("date:")==-1&&tag.indexOf("time:")==-1&&tag.indexOf("type:")==-1&&tag.indexOf("mime:")==-1&&tag.indexOf("file_ex:")==-1&&tag.indexOf("file_name:")==-1&&tag.indexOf("size:")==-1)
					{
						$("#window-tags").append(`<div class="inbox underline tag" onclick="$('#searcher-input').attr('value','${tag}');ui.window.content.hide()">${tag}</div><span contenteditable=false> </span>`)
					}
					else
					{
						$("#window-sys-tags").append(`<div class="inbox underline tag" onclick="$('#searcher-input').attr('value','${tag}');ui.window.content.hide()">${tag}</div>`)
					}
				}
			},
			renderContent:function(index,data)
			{
				if(ui.window.current.hash[index].mime.match(/image/))
					{
					$("#window-content").html(`<center><img style="height:70%;width:auto;border-radius:4px;" src='${data}'></img></center>`);
					chan.getFile(ui.window.current,function(data){
						$("#window-content").html(`<center><img id="window-content-image" style="height:70%;width:auto;border-radius:4px;" src='${data}'></img></center>`)
						let img=$("#window-content").children("center")
						img[0].onclick=function(e){
							//ui.window.content.toggleFull()
						}
					},index)
					}
			},
			hide:function()
			{
				$("#window").css({display:"none"});
				$("#desktop").css({display:"none"});
			},
			editTags:function()
			{
				if($("#window-tagedit").attr("src")=="static/save.svg")
				{
					$("#window-tagedit").attr("src","static/edit.svg");
					$("#window-tags").attr("contenteditable","false");
					$(".tag").click(function(){
					$('#searcher-input').attr('value',this.html());ui.window.content.hide()})
					ui.window.current.tags=[];
					$(".tag").each(function(key,el){
						ui.window.current.tags.push(el.innerHTML)
					});
					chan.edit(ui.window.current);
				}
				else
				{
					$("#window-tagedit").attr("src","static/save.svg");
					$("#window-tags").attr("contenteditable","true");
					document.execCommand("defaultParagraphSeparator",false,"img");
				}
			},
			toggleFull:function()
			{
				$("#window").css({height:"95%"});
				$("#window-content-image").css({height:"95%"});
				$("#window-footer").css({display:"none"});
			}
		},
		msg:{
			open:function()
			{
				$("#msg").addClass("opened");
			},
			show:function(msg,time)
			{
				if(!time){var time=5000};
				$("#msg-content").html(msg);
				if(time!=Infinity)
				{
					setTimeout(function(){ui.window.msg.hide()},5000)
				}
			},
			hide:function()
			{
				$("#msg").removeClass("opened");
			}
		},
		loading:{
			show:function()
			{
				$("#db_load").css({display:"block"});
				$("#desktop").css({display:"block"});
				$("#db_load-content").html("Инициализация баз данных...");
			},
			hide:function()
			{
				$("#db_load").css({display:"none"});
				$("#desktop").css({display:"none"});
			}
		}
	},
	mansory:{
		render:function(db)
		{
			//db=obj2arr(db).sort("date");
			for(let content in db)
			{
				ui.mansory.renderOne(db[content],db)
			}
		},
		renderOne:function(content,db)
		{
			if(content.type=="file")
			{
			if(content.tags.includes('mime:image/gif'))
				{
					let block=$(`<div class='box dynamic content-block'>
						<img src='static/download.svg'></img><span style="font-size:1em">Gif</span></div>`).prependTo("#mansory");
						let $curr=content;
					chan.getPreview(content,function(preview){
						block.children("img")[0].src=preview;
						block.click(function(){
							ui.window.content.show($curr.hash,preview)
						})
					})
				}
				else if(content.tags.includes('type:image'))
				{
					let block=$(`<div class='box dynamic content-block'>
						<img src='static/download.svg'></img></div>`).prependTo("#mansory");
						let $curr=content;
					chan.getPreview(content,function(data){
						block.children("img")[0].src=data;
						block.click(function(){
							console.log($curr)
							ui.window.content.show($curr.hash,data)
							})
					})
				}
				else if(content.tags.includes('type:audio'))
				{
					let autor=chan.getPrefix(content,"autor");
					let name=chan.getPrefix(content,"name");
					$("#mansory").append(`<div class='box dynamic content-block' onclick="ui.window.content.show('${content.hash}')">
					${name}<br>
					${autor}<br>
					<audio controls src='https://gateway.ipfs.io/ipfs/${content.hash}'></audio></div>`);
				}
				else if(content.tags.includes('type:video'))
				{
					chan.getPreview(content,function(preview){
						$("#mansory").append(`<div class='box dynamic content-block' onclick="ui.window.content.show('${content.hash}')">
						<img src='${preview}'></img><br>Video: ${chan.getPrefix(content,"file_ex")}</div>`);
					})
				}
				else
				{
					$("#mansory").prepend(`<div class='box dynamic content-block' onclick="ui.window.content.show('${content.hash}')" style="overflow:hidden;">
						<a style="float:left;"><img src="static/file.svg" style="width:20px"></img></a><span style="width:99%;">${chan.getPrefix(content,"file_name")}</span><br>File: ${chan.getPrefix(content,"file_ex")}</div>`);
				}
			}
			else if(content.type=="dir")
			{
				if(content.preview[0])
				{
				let block=$(`<div class='box dynamic content-block'>
						<img src='static/download.svg'></img><span style="font-size:1em">Directory</span></div>`).prependTo("#mansory");
						let $curr=content;
					chan.getPreview(content,function(preview){
						block.children("img")[0].src=preview;
						block.click(function(){
							ui.window.content.show(content.name,preview);
						})
					},0)
				}
				else if(content.hash[0].mime.match(/audio/))
				{
					
				}
				else
				{
					$("#mansory").prepend(`<div class='box dynamic content-block' onclick="ui.window.content.show('${content.hash}')" style="overflow:hidden;">
						<a style="float:left;"><img src="static/file.svg" style="width:20px"></img></a><span style="width:99%;">${chan.getPrefix(content,"file_name")}</span><br>Directory</div>`)
				}
			}
		}
	},
	postingForm:{
		preview:[],
		create:function()
		{
			var files=$("#file")[0].files
			var tags=$("#tags")[0].value.split(" ");
			if(files.length==1)
			{
				chan.create(files[0],tags,{preview:ui.postingForm.preview[0]});
			}
			else
			{
				let name=$("#dirname")[0].value
				chan.createDir(files,name,tags,ui.postingForm.preview);
			}
			$("#preview-video").css({display:"none"});
			$("#pv-video")[0].src="";
			$("#preview-content").html("");
			$("#preview").css({display:"none"});
			$("#tags")[0].value="";
			$("#dirname")[0].value="";
		},
		onchange:function()
		{
			var files=$("#file")[0].files;
			ui.postingForm.preview=[];
			if(files.length>1)
			{
				$("#dirname")[0].value="";
				$("#dir-div").css({display:"block"});
			}
			else
			{
				$("#dirname")[0].value="";
				$("#dir-div").css({display:"none"});
			}
			$("#preview-content").html("")
			async function ppprev(){
				for(let file of files)
				{
				if(file.type.indexOf("video")>-1)
				{
					await thumbnail(files,function(blob){ui.postingForm.preview.push(blob)})
					$("#preview-video").css({display:"block"});
				}
				else if(file.type.indexOf("image")>-1)
				{
					let blob=await thumbnail_image(file);
					ui.postingForm.preview.push(blob);
					$("#preview").css({display:"block"});
				}
				else
				{
					$("#preview-content").append(`<div style="display:inline-block;background-color:lightgray;border-radius:4px;margin:4px;width:30%;overflow:hidden"><img src="static/file.svg" style="width:50%"></img><br>${file.name}</div>`)
					$("#preview").css({display:"block"});
				}
				}
		}
		ppprev()
		}
	},
	searcher:{
		search:function(event)
		{
			if(event.key=="Enter")
			{
				ui.mansory.render(chan.search($("#searcher-input")[0].value));
			}
		}
	}
}
ui.window.loading.show()
chan.oninitend=function()
{
	ui.window.loading.hide()
	ui.mansory.render(chan.db.all);
	ui.window.msg.open()
	ui.window.msg.show("Репликация базы данных, погодите...");
}
chan.onerror=function(e)
{
	ui.window.msg.show(e);
	console.error(e);
}
chan.onreplicate=function()
{
	$_last=chan.db.all;
}
chan.onreplicated=function()
{
	var db=Vytcleniti();
	ui.mansory.render(db);
}
chan.onprogress=function(addr,hash,entry,progress,have)
{
	var progress=Math.floor((progress/entry.next.length-1)*100);
	ui.window.msg.show(`Репликация базы данных: ${progress}%`,Infinity)
	console.log(entry,progress,have);
	if(progress==100)
	{
		ui.window.msg.hide();
	}
}
chan.oncontentcreate=function()
{
	ui.window.msg.open();
	ui.window.msg.show("Лоадинг контента, погодите...")
}
chan.oncontentcreated=function(content)
{
	ui.window.msg.open();
	ui.window.msg.show("Создано!");
	ui.mansory.renderOne(content,chan.db.all);
}
function OnKey(event)
{
	if(event.code=='Enter'){event.cancelBubble=true;event.returnValue=false;ui.window.content.editTags();}
	if(event.code=='Space'){
document.execCommand('insertHTML',false,'<span contenteditable=false> </span><div class="inbox underline tag"></div>');event.cancelBubble=true;event.returnValue=false;}
}
function thumbnail(file,func){
	var fr=new FileReader()
	fr.onload=function(){
    var video=$("#pv-video")[0];
	video.style="width:50%"
	video.src=fr.result;
	var canvas=document.createElement('canvas');
	var getted=false;
	inter=setInterval(function(){
	canvas.width=video.videoWidth;
	canvas.height=video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, video.videoWidth,video.videoHeight);
	canvas.toBlob(function(blob){
		if(blob&&blob.size>=100000&&!getted)
		{
			getted=true;
			func(blob);
			clearInterval(inter)
		}
	})
	},100)
}
fr.readAsDataURL(file)
}
function thumbnail_image(file,func)
{
	return new Promise(function(resolve)
	{
		var fr=new FileReader();
	var img=$(`<img style="height:50%;margin:5px"></img>`).appendTo("#preview-content")
	fr.onload=function(){
		var canvas=document.createElement('canvas');
		img[0].src=fr.result;
		img.load(function(){
			canvas.width=img[0].width;
			canvas.height=img[0].height;
			canvas.getContext('2d').drawImage(img[0], 0, 0,canvas.width,canvas.height);
			canvas.toBlob(function(blob){
				resolve(blob);
		})
		})
	}
	fr.readAsDataURL(file);
	})
}
function obj2arr(obj)
{
	var arr=[]
	for(i in obj)
	{
		arr.push(obj[i])
	}
	return arr
}
function Vytcleniti()
{
	res=[]
	for(i in chan.db.all)
	{
		if(!$_last[i])
		{
			res.push(chan.db.all[i])
		}
	}
	return res;
}