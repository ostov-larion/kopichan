Vue.component("searcher",{
	data:function(){
		return {
			value:""
		}
	},
	methods:{
		enter:function(){
			Mansory.contents=chan.search(this.value)
		}
	},
	template:`<div class='box searcher' style='width:15%;padding:3px;padding-bottom:4px;display:initial;margin-right:0px;'>
			<b style='font-family:Consolas;'>> </b>
			<input type='text' v-model="value" @keyup.enter="enter" class="searcher" style='border:none;outline:none;font-family:Consolas'></input>
		</div>`
})