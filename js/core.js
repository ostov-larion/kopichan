openDB()
peer = new Peer({
	host: 'kopichan-server.herokuapp.com',
	port: '',
	path: '/kopi',
	secure: true
})
peer_id = ""
Connections = new Set()
peer.on('open',() => {
		peer_id = peer.id
		console.log('Ok, peer opened.')
		listAllPeers()
	}
)
peer.on("disconnected",() => {
	peer.reconnect()
})

peer.on("connection", connection => {
	console.log('Another peer connceted')
	connection.on('data', data => {
		if(data.getDB){
			let answer = peer.connect(connection.peer)
			answer.on("open", () => {
				DBRequest = indexedDB.open("kopiDB", 1)
				DBRequest.onsuccess = function(event){
					let db = event.target.result
					let main = db.transaction("main","readonly").objectStore("main")
					main.getAll().onsuccess = ev => answer.send({postDB: ev.target.result})
				}
			})
			answer.on('data', data => {
				if(data.postDB) {
					console.log('Putting db from another peer')
					putDB(data.postDB)
				}
			})
		}
		if(data.postDB) {
			console.log('Putting db from another peer')
			putDB(data.postDB)
		}
	})
})
function listAllPeers(){
	peer.listAllPeers(list => onPeersLoaded(list))
}
function onPeersLoaded(peers){
	console.log('Peers:',peers)
	connectToPeers(peers)
}
function connectToPeers(peers){
	console.log('Connecting to peers...')
	if(!peers) {
		console.log('wut?')
		return false
	}
	for(id of peers){
		if(id != peer_id) {
			console.log(id,peer_id,id==peer_id)
			let conn = peer.connect(id)
			conn.on('open', () => {
				getDB()
			})
		}
	}
	onConnectionDone()
}
function onConnectionDone(){
}
function getDB(){
	for(p in peer.connections) {
		console.log("... works??")
		peer.connections[p][0].send({getDB:true})
	}
}

function dispatch(msg){
	for(p in peer.connections) {
		console.log("Send message...")
		if(peer.connections[p]){
			for(i in peer.connections[p]) peer.connections[p][i].send(msg)
		}
	}
}

function openDB(){
	let DBRequest = indexedDB.open("kopiDB", 1)
	DBRequest.onupgradeneeded = function(event){
		let db = event.target.result;
		if(db.objectStoreNames.contains("main")) return
		main = db.createObjectStore("main", {keyPath: "hash"})
		main.createIndex("hash", "hash", { unique: true  })
		main.createIndex("tags", "tags", { unique: false })
		main.createIndex("file", "file", { unique: false })
	}
	DBRequest.onsuccess = function(event){
		let db = event.target.result;
		let main = db.transaction("main","readwrite").objectStore("main")
		main.getAll().onsuccess = function(event){
			let data = event.target.result
			for(i in data){
				MasonryState.add(data[i].file,data[i].tags)
			}
		}
	}
}

function putDB(data){
	DBRequest = indexedDB.open("kopiDB", 1)
	DBRequest.onsuccess = function(event){
		let db = event.target.result
		let main = db.transaction("main","readwrite").objectStore("main")
		console.log('Putting db...')
		for(i in data){
			main.add(data[i])
			MasonryState.add(data[i].file, data[i].tags)
		}
	}
	DBRequest.onerror = function(){
		console.error('WUT???')
	}
}