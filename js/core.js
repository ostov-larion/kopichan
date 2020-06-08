let page = 0
let pageSize = window.innerWidth > 600 ? 50 : 10

let isLoading = true;
(async() => {
	
let iceServers = await fetch('https://cors-anywhere.herokuapp.com/https://kopichan-turn-server.herokuapp.com')
peer = new Peer({
	host: 'kopichan-server.herokuapp.com',
	port: '',
	path: '/kopi',
	config: {
		iceServers: await iceServers.json()
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
		main.on("peer",async() => {
			M.toast({html: "New peer is connected."})
			main.getPage(page,pageSize,await main.getAllKeys())
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