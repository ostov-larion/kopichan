ui={
	window:{
		content:{
			current:{},
			show:function(content,data)
			{
				ui.window.current=chan.db.all[content]
				$("#desktop").css({display:"block"});
				$("#window").css({display:"block"});
				if(ui.window.current.tags.includes('type:image'))
				{
					$("#window-content").html(`<center><img style="height:70%;width:auto;border-radius:4px;" src='${data}'></img></center>`);
					chan.getFile(ui.window.current,function(data){
						$("#window-content").html(`<center><img style="height:70%;width:auto;border-radius:4px;" src='${data}'></img></center>`)
						let img=$("#window-content").children("center")
						img[0].onmousewheel=function(e){
							console.log(e,this);
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
					})
				}
				$("#window-tags").html("");
				$("#window-sys-tags").html("");
				for(var tag of ui.window.current.tags)
				{
					tag=tag.replace("<","&lt;").replace(">","&gt;");
					console.log(tag.indexOf("date:"))
					if(tag.indexOf("date:")==-1&&tag.indexOf("time:")==-1&&tag.indexOf("type:")==-1&&tag.indexOf("mime:")==-1&&tag.indexOf("file_ex:")==-1&&tag.indexOf("file_name:")==-1)
					{
						$("#window-tags").append(`<div class="inbox underline tag" onclick="$('#searcher-input').attr('value','${tag}');ui.window.content.hide()">${tag}</div>`)
					}
					else
					{
						$("#window-sys-tags").append(`<div class="inbox underline tag" onclick="$('#searcher-input').attr('value','${tag}');ui.window.content.hide()">${tag}</div>`)
					}
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
			}
		},
		error:{
			show:function(err)
			{
				$("#err-content").html(err);
				$("#err").addClass("opened");
				setTimeout(function(){ui.window.error.hide()},5000)
			},
			hide:function()
			{
				$("#err").removeClass("opened");
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
			$("#mansory").html("");
			//db=obj2arr(db).sort("date");
			for(let content in db)
			{
				ui.mansory.renderOne(content,db)
			}
		},
		renderOne:function(content,db)
		{
			if(db[content].tags.includes('mime:image/gif'))
				{
					let block=$(`<div class='box dynamic content-block'>
						<img src='static/download.svg'></img><span style="font-size:1em">Gif</span></div>`).prependTo("#mansory");
						let $curr=db[content];
					chan.getPreview(db[content],function(preview){
						block.children("img")[0].src=preview;
						block.click(function(){
							ui.window.content.show($curr.hash,preview)
						})
					})
				}
				else if(db[content].tags.includes('type:image'))
				{
					let block=$(`<div class='box dynamic content-block'>
						<img src='static/download.svg'></img></div>`).prependTo("#mansory");
						let $curr=db[content];
					chan.getPreview(db[content],function(data){
						block.children("img")[0].src=data;
						block.click(function(){
							console.log($curr)
							ui.window.content.show($curr.hash,data)
							})
					})
				}
				else if(db[content].tags.includes('type:audio'))
				{
					let autor=chan.getPrefix(db[content],"autor");
					let name=chan.getPrefix(db[content],"name");
					$("#mansory").append(`<div class='box dynamic content-block' onclick="ui.window.content.show('${db[content].hash}')">
					${name}<br>
					${autor}<br>
					<audio controls src='https://gateway.ipfs.io/ipfs/${db[content].hash}'></audio></div>`);
				}
				else if(db[content].tags.includes('type:video'))
				{
					chan.getPreview(db[content],function(preview){
						$("#mansory").append(`<div class='box dynamic content-block' onclick="ui.window.content.show('${db[content].hash}')">
						<img src='${preview}'></img><br>Video:${chan.getPrefix(db[content],"file_ex")}</div>`);
					})
				}
		}
	},
	postingForm:{
		preview:null,
		create:function()
		{
			var file=$("#file")[0].files[0];
			var tags=$("#tags")[0].value.split(" ");
			var post=chan.create(file,tags,ui.postingForm.preview);
			$("#preview").css({display:"none"});
			$("#pv-gif").css({display:"none"});
			$("#preview-video")[0].src="";
			$("#tags")[0].value="";
		},
		onchange:function()
		{
			var file=$("#file")[0].files[0];
			ui.postingForm.preview=null;
			if(file.type.indexOf("video")>-1)
			{
				$("#preview").css({display:"block"});
				thumbnail(file,function(blob){ui.postingForm.preview=blob})
			}
			else if(file.type.indexOf("gif")>-1)
			{
				$("#pv-gif").css({display:"block"});
				thumbnail_gif(file,function(blob){ui.postingForm.preview=blob})
			}
			else if(file.type.indexOf("image")>-1)
			{
				$("#pv-gif").css({display:"block"});
				thumbnail_image(file,function(blob){ui.postingForm.preview=blob})
			}
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
}
chan.onerror=function(e)
{
	ui.window.error.show(e);
	console.error(e)
}
chan.onreplicated=function()
{
	ui.mansory.render(chan.db.all);
}
chan.oncontentcreated=function(content)
{
	ui.mansory.renderOne(content.hash,chan.db.all)
}
function OnKey(event)
{
	if(event.code=='Enter'){event.cancelBubble=true;event.returnValue=false;ui.window.content.editTags();}
	if(event.code=='Space'){
document.execCommand('insertHTML',false,'<div class="inbox underline tag"></div>');event.cancelBubble=true;event.returnValue=false;}
}
function thumbnail(file,func){
	var fr=new FileReader()
	fr.onload=function(){
    var video=$('#preview-video')[0];
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
function thumbnail_gif(file,func)
{
	var fr=new FileReader();
	fr.onload=function(){
		var gif=$('#preview-gif')[0];
		gif.src=fr.result;
		var canvas=document.createElement('canvas');
		gif.onload=function(){
			canvas.width=gif.naturalWidth;
			canvas.height=gif.naturalHeight;
			canvas.getContext('2d').drawImage(gif, 0, 0);
			canvas.toBlob(function(blob){
				func(blob);
		})
		}
	}
	fr.readAsDataURL(file);
}
function thumbnail_image(file,func)
{
	var fr=new FileReader();
	fr.onload=function(){
		var gif=$('#preview-gif')[0];
		gif.src=fr.result;
		var canvas=document.createElement('canvas');
		gif.onload=function(){
			canvas.width=gif.width;
			canvas.height=gif.height;
			canvas.getContext('2d').drawImage(gif, 0, 0,canvas.width,canvas.height);
			canvas.toBlob(function(blob){
				func(blob);
		})
		}
	}
	fr.readAsDataURL(file);
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
