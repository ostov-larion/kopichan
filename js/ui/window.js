Vue.component("window",{
	props:["content"],
	data:function(){
		return {
			active:false
		}
	},
	created:function()
		{
			try{
			this.src='https://gateway.ipfs.io/ipfs/'+this.content.hash
			}
			catch(e){}
		},
	template:``
})
