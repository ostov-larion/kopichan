(async() => {
peer = new Peer({
	host: 'kopichan-server.herokuapp.com',
	port: '',
	path: '/kopi',
	config: {
		iceServers: [{"url":"stun:global.stun.twilio.com:3478?transport=udp","urls":"stun:global.stun.twilio.com:3478?transport=udp"},{"url":"turn:global.turn.twilio.com:3478?transport=udp","username":"a710e11718e0a3cc5ea11080056221c0991eba20fd87ed62917fc79689fb5ae5","urls":"turn:global.turn.twilio.com:3478?transport=udp","credential":"+mwEzi1TwrrzPh/Q6v/qThJktpjXaxPA38ljzqmN5Ew="},{"url":"turn:global.turn.twilio.com:3478?transport=tcp","username":"a710e11718e0a3cc5ea11080056221c0991eba20fd87ed62917fc79689fb5ae5","urls":"turn:global.turn.twilio.com:3478?transport=tcp","credential":"+mwEzi1TwrrzPh/Q6v/qThJktpjXaxPA38ljzqmN5Ew="},{"url":"turn:global.turn.twilio.com:443?transport=tcp","username":"a710e11718e0a3cc5ea11080056221c0991eba20fd87ed62917fc79689fb5ae5","urls":"turn:global.turn.twilio.com:443?transport=tcp","credential":"+mwEzi1TwrrzPh/Q6v/qThJktpjXaxPA38ljzqmN5Ew="}]
	}
    secure: true,
	debug: 3
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
		main.on("sync", async(list) => {
			MasonryState.contents = await main.getAllLocally()
			m.redraw()
			main.getAll()
			main.on("post", async() => {
				MasonryState.contents = await main.getAllLocally()
				//isLoading = false
				m.redraw()
			})
		})
	},1000)
})

})()