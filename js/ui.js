Mansory=new Vue({
	el:"mansory",
	data:{
		contents:[]
	}
})
Searcher=new Vue({
	el:"searcher"
})
function CreateContent()
{
	var file=document.getElementById("file").files[0];
	var desc=document.getElementById("desc").value;
	var tags=document.getElementById("tags").value.split(" ");
	var post=chan.create(file,desc,tags);
	ui.mansory.render()
}
ui={
	window:{
		show:function(content)
		{
			document.getElementById("desktop").style="display:block;position:fixed;background-color:rgba(0,0,0,0.3);top:0px;left:0px;width:100%;height:100%;";
			document.getElementById("window").style="display:block;width:40%;margin:3% auto;height:80%;";
			document.getElementById("window.content").innerHTML=`<center><img style="height:70%;width:auto" src='https://gateway.ipfs.io/ipfs/${content.hash}'></img></center>`
			document.getElementById("window.tags").innerHTML=""
			for(var tag of content.tags)
			{
				document.getElementById("window.tags").innerHTML+=`<button class="inbox underline" onclick="document.getElementById('searcher').children[1].value='${tag}';ui.window.hide()">${tag}</button>`
			}
		},
		hide:function()
		{
			document.getElementById("window").style="display:none";
			document.getElementById("desktop").style="display:none";
		}
	},
	mansory:{
		render:function(){
			for(let content in db.all)
			{
				document.getElementById("mansory")
			}
		}
	}
}