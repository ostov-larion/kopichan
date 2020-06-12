let page = 0
let pageSize = window.innerWidth > 600 ? 50 : 10

let isLoading = true;

if(!localStorage.favs){
	localStorage.favs = "[]"
}
if(!localStorage.blackListHashs){
	localStorage.blackListHashs = "[]"
}
if(!localStorage.blackListTags){
	localStorage.blackListTags = "[]"
}

Favorites = {
	contents: JSON.parse(localStorage.favs),
	add(hash){
		this.contents.push(hash)
		localStorage.favs = JSON.stringify(this.contents)
		BlacklistHashs.remove(hash)
	},
	remove(hash){
		this.contents.splice(this.contents.indexOf(hash),1)
		localStorage.favs = JSON.stringify(this.contents)
	},
	has(hash){
		return this.contents.includes(hash)
	}
}
BlacklistHashs = {
	contents: JSON.parse(localStorage.blackListHashs),
	add(hash){
		this.contents.push(hash)
		localStorage.blackListHashs = JSON.stringify(this.contents)
		Favorites.remove(hash)
	},
	remove(hash){
		this.contents.splice(this.contents.indexOf(hash),1)
		localStorage.blackListHashs = JSON.stringify(this.contents)
	},
	has(hash){
		return this.contents.includes(hash)
	}
}

BlacklistTags = {
	accept: false,
	contents: JSON.parse(localStorage.blackListTags),
	set(data){
		this.contents = data
		localStorage.blackListTags = JSON.stringify(this.contents)
	}
}

TagRegister = {
	tags: {},
	add(tag) {
		if(this.tags[tag]) {
			this.tags[tag]++
		}
		else {
			this.tags[tag] = 1
		}
	}
};

(async() => {
	
peer = new Peer({
	host: 'kopichan-server.herokuapp.com',
	port: '',
	path: '/kopi',
	config: {
		'iceServers': [
						{url:'stun:stun01.sipphone.com'},
						{url:'stun:stun.ekiga.net'},
						{url:'stun:stun.fwdnet.net'},
						{url:'stun:stun.ideasip.com'},
						{url:'stun:stun.iptel.org'},
						{url:'stun:stun.rixtelecom.se'},
						{url:'stun:stun.schlund.de'},
						{url:'stun:stun.l.google.com:19302'},
						{url:'stun:stun1.l.google.com:19302'},
						{url:'stun:stun2.l.google.com:19302'},
						{url:'stun:stun3.l.google.com:19302'},
						{url:'stun:stun4.l.google.com:19302'},
						{url:'stun:stunserver.org'},
						{url:'stun:stun.softjoys.com'},
						{url:'stun:stun.voiparound.com'},
						{url:'stun:stun.voipbuster.com'},
						{url:'stun:stun.voipstunt.com'},
						{url:'stun:stun.voxgratia.org'},
						{url:'stun:stun.xten.com'},
						{
							url: 'turn:numb.viagenie.ca',
							credential: 'muazkh',
							username: 'webrtc@live.com'
						},
						{
							url: 'turn:192.158.29.39:3478?transport=udp',
							credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
							username: '28224511:1379330808'
						},
						{
							url: 'turn:192.158.29.39:3478?transport=tcp',
							credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
							username: '28224511:1379330808'
						}
					],
		//'sdpSemantics': 'unified-plan' 
	},
    secure: true,
	debug: 3
})

MainScheme = {
    keyPath: "hash",
    indexes: [
        {name: "hash", unique: true},
        {name: "tags"},
        {name: "file"},
		{name: "mime"},
		{name: "options"}
    ]
}

FilePeruse = file => new Promise(resolve => {
	let fr = new FileReader()
	fr.readAsDataURL(file)
	fr.onload = () => resolve(fr.result)
})

peer.on("open", async() => {
    octo = new OctoDB(peer)
    main = await octo.open('main',MainScheme)
	isLoading = false
	m.redraw()
	main.on("sync", async(list) => {
		main.getPageLocally(page,pageSize)
		main.getAllTags()
		main.on("peer",async() => {
			M.toast({html: "New peer is connected."})
			main.getPage(page,pageSize,BlacklistHashs.contents)
		})
		M.toast({html:'Getting DB...'})
		main.on('page', data => {
			FilePeruse(data.file).then(src => MasonryState.add(data.hash,data.file,src,data.tags))
		})
		main.on("post", async(data) => {
			FilePeruse(data.file).then(src => MasonryState.add(data.hash,data.file,src,data.tags))
		})
		main.on("add", async(data) => {
			FilePeruse(data.file).then(src => MasonryState.add(data.hash,data.file,src,data.tags))
		})
		main.on("setTags",async(data) => {
			MasonryState.contents.forEach(e => e.hash == data.hash && (e.tags = data.tags))
			m.redraw()
		})
	})
})

})()