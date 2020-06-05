(async() => {

isLoading = true
m.redraw()

peer = new Peer({
	host: 'kopichan-server.herokuapp.com',
	port: '',
	path: '/kopi',
    secure: true
})


MainScheme = {
    keyPath: "hash",
    indexes: [
        {name: "hash", unique: true},
        {name: "tags"},
        {name: "file"}
    ]
}

peer.on("open", async() => {
    octo = new OctoDB(peer)
    main = await octo.open('main',MainScheme)
    main.on('add', value => MasonryState.add(value.file,value.tags))
	setTimeout( async() => {
		let d = await main.getAllLocally()
		if(d.length > 0){
			MasonryState.contents = await main.getAllLocally()
			isLoading = false
			m.redraw()
		}
		else{
			main.getAll()
		}
		main.on("post", async() => {
			MasonryState.contents = await main.getAllLocally()
			isLoading = false
			m.redraw()
		})
	},1000)
})

})()