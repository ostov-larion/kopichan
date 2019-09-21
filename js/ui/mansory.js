Vue.component("mansory",{
	props:["contents"],
	template:`<div id="mansory" class='mansory'>
	<content-block v-for="i in contents" :content="i"></content-block>
	</div>`
})
Vue.component("content-block",{
	props:["content"],
	data:function()
	{
		return {
			src:"static/download.svg"
		}
	},
	created:function()
		{
			this.src='https://gateway.ipfs.io/ipfs/'+this.content.hash
		},
		methods:{
			click:function()
			{
				ui.window.show(this.content)
			}
		},
	template:`<div class='box dynamic content-block' @click="click">
		<img :src="src" width='99%' v-if="content.tags.includes('type:image')"></img>
	</div>`
})