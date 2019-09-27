ui={
	window:{
		content:{
			current:{},
			show:function(content)
			{
				ui.window.current=chan.db.all[content]
				$("#desktop").css({display:"block"});
				$("#window").css({display:"block"});
				if(ui.window.current.tags.includes('type:image'))
				{
					$("#window-content").html(`<center><img style="height:80%;width:auto;" src='https://gateway.ipfs.io/ipfs/${ui.window.current.hash}'></img></center>`);
				}
				else if(ui.window.current.tags.includes('type:audio'))
				{
					
				}
				else if(ui.window.current.tags.includes('type:video'))
				{
					$("#window-content").html(`<center><video style="width:80%;height:auto;" controls preload="metadata" src='https://gateway.ipfs.io/ipfs/${ui.window.current.hash}'></video></center>`);
				}
				$("#window-tags").html("");
				for(var tag of ui.window.current.tags)
				{
					tag=tag.replace("<","&lt;").replace(">","&gt;");
					$("#window-tags").append(`<div class="inbox underline tag" onclick="$('#searcher-input').attr('value','${tag}');ui.window.content.hide()">${tag}</div>`)
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
				$("#db_load-content").html("Загрузка баз данных...");
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
			for(let content in db)
			{
				if(db[content].tags.includes('type:image'))
				{
					$("#mansory").append(`<div class='box dynamic content-block' onclick="ui.window.content.show('${db[content].hash}')">
							<img src='https://gateway.ipfs.io/ipfs/${db[content].hash}'></img></div>`);
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
					$("#mansory").append(`<div class='box dynamic content-block' onclick="ui.window.content.show('${db[content].hash}')">
					<img src="static/play.svg" style="width:40px;position:absolute;margin:20% 30%;"></img><img src='https://gateway.ipfs.io/ipfs/${db[content].preview}'></img></div>`);
				}
				else
				{
					
				}
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
			$("#preview-video")[0].src="";
		},
		onchange:function()
		{
			var file=$("#file")[0].files[0];
			if(file.type.indexOf("video")>-1)
			{
				$("#preview").css({display:"block"});
				thumbnail(file,function(blob){ui.postingForm.preview=blob})
			}
		}
	},
	searcher:{
		search:function(event)
		{
			if(event.key=="Enter")
			{
				ui.mansory.render(chan.search($("#searcher-input").value));
			}
		}
	}
}
ui.window.loading.show()
function OnKey(event)
{
	if(event.code=='Enter'){event.cancelBubble=true;event.returnValue=false;ui.window.content.editTags();}
	if(event.code=='Space'){
document.execCommand('insertHTML',false,'<div class="inbox underline tag">tag</div>');event.cancelBubble=true;event.returnValue=false;}
}
function thumbnail(file,func){
	fr=new FileReader()
	fr.onload=function(){
    var video = $('#preview-video')[0];
	video.src=fr.result;
	var canvas = document.createElement('canvas');
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