(async() => {
peer = new Peer({
	host: 'kopichan-server.herokuapp.com',
	port: '',
	path: '/kopi',
	config: {
		iceServers: [{"url":"stun:global.stun.twilio.com:3478?transport=udp","urls":"stun:global.stun.twilio.com:3478?transport=udp"},{"url":"turn:global.turn.twilio.com:3478?transport=udp","username":"a710e11718e0a3cc5ea11080056221c0991eba20fd87ed62917fc79689fb5ae5","urls":"turn:global.turn.twilio.com:3478?transport=udp","credential":"+mwEzi1TwrrzPh/Q6v/qThJktpjXaxPA38ljzqmN5Ew="},{"url":"turn:global.turn.twilio.com:3478?transport=tcp","username":"a710e11718e0a3cc5ea11080056221c0991eba20fd87ed62917fc79689fb5ae5","urls":"turn:global.turn.twilio.com:3478?transport=tcp","credential":"+mwEzi1TwrrzPh/Q6v/qThJktpjXaxPA38ljzqmN5Ew="},{"url":"turn:global.turn.twilio.com:443?transport=tcp","username":"a710e11718e0a3cc5ea11080056221c0991eba20fd87ed62917fc79689fb5ae5","urls":"turn:global.turn.twilio.com:443?transport=tcp","credential":"+mwEzi1TwrrzPh/Q6v/qThJktpjXaxPA38ljzqmN5Ew="}]
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
		{name: "options"}
    ]
}
page = 0

isLoading = true

peer.on("open", async() => {
    octo = new OctoDB(peer)
    main = await octo.open('main',MainScheme)
    main.on('add', value => MasonryState.add(value.file,value.tags))
	isLoading = false
	m.redraw()
	main.on("sync", async(list) => {
		main.getPageLocally(page,10)
		main.on('page', value => {
			MasonryState.add(value.hash,value.file,value.tags)
		})
		setTimeout(() => main.getPage(page,30),1000)
		main.on("post", async(data) => {
			!MasonryState.contents.find(e => e.hash == data.hash) && MasonryState.add(data.hash,data.file,data.tags)
		})
		main.on("add", async(data) => {
			MasonryState.add(data.hash,data.file,data.tags)
		})
	})
})

})()