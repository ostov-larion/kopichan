class OctoDB {
    constructor(peer){
        this.peer = peer
        this.created = false
    }
    async open(name,scheme){
        return await new Promise( (resolve,reject) => {
            let request = indexedDB.open("OctoDB/"+name,1)
            request.onupgradeneeded = event => {
                this.created = true
                let db =  event.target.result
                let store = db.createObjectStore(name,{keyPath: scheme.keyPath})
                for(let index of scheme.indexes){
                    store.createIndex(index.name, index.name,{unique: index.unique})
                }
                resolve(new OctoStoreTransaction(name,db,scheme,this.peer))
            }
            request.onsuccess = event =>{
                if(this.created) return
                let db =  event.target.result
                resolve(new OctoStoreTransaction(name,db,scheme,this.peer))
            }
            request.onerror = () => {
                reject(request.error)
            }
        })
    }
}

class EventEmmiter {
    on(eventName, handler) {
      if (!this._eventHandlers) this._eventHandlers = {};
      if (!this._eventHandlers[eventName]) {
        this._eventHandlers[eventName] = [];
      }
      this._eventHandlers[eventName].push(handler);
    }
    off(eventName, handler) {
      let handlers = this._eventHandlers && this._eventHandlers[eventName];
      if (!handlers) return;
      for (let i = 0; i < handlers.length; i++) {
        if (handlers[i] === handler) {
          handlers.splice(i--, 1);
        }
      }
    }
    trigger(eventName, ...args) {
      if (!this._eventHandlers || !this._eventHandlers[eventName]) {
        return; 
      }
      this._eventHandlers[eventName].forEach(handler => handler.apply(this, args));
    }
}

class OctoStoreTransaction extends EventEmmiter {
    #db = {}
    constructor(name,db,scheme,peer){
        super()
        this.name = name
        this.scheme = scheme
        this.#db = db
        this.peer = peer
        this.sync()
    }
    add(value){
        this.scheme.beforeAdd && this.scheme.beforeAdd(value)
        let store = this.#db.transaction(this.name,"readwrite").objectStore(this.name)
        let request = store.add(value)
        this.dispatch({add: value})
        this.trigger("add",value)
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(value)
            request.onerror = () => reject(request.error)
        })
    }
    addLocally(value){
        this.scheme.beforeAdd && this.scheme.beforeAdd(value)
        let store = this.#db.transaction(this.name,"readwrite").objectStore(this.name)
        let request = store.add(value)
        this.trigger("add",value)
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(value)
            request.onerror = () => reject(request.error)
        })
    }
    put(value){
        this.scheme.beforePut && this.scheme.beforePut(value)
        let store = this.#db.transaction(this.name,"readwrite").objectStore(this.name)
        let request = store.put(value)
        this.dispatch({put: value})
        this.trigger("put",value)
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(value)
            request.onerror = () => reject(request.error)
        })
    }
    putLocally(value){
        this.scheme.beforePut && this.scheme.beforePut(value)
        let store = this.#db.transaction(this.name,"readwrite").objectStore(this.name)
        let request = store.put(value)
        this.trigger("put",value)
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(value)
            request.onerror = () => reject(request.error)
        })
    }
    delete(key){
        this.scheme.beforeDelete && this.scheme.beforeDelete(value)
        let store = this.#db.transaction(this.name,"readwrite").objectStore(this.name)
        let request = store.delete(key)
        this.dispatch({delete: key})
        this.trigger("delete",key)
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(key)
            request.onerror = () => reject(request.error)
        })
    }
    deleteLocally(key){
        this.scheme.beforeDelete && this.scheme.beforeDelete(value)
        let store = this.#db.transaction(this.name,"readwrite").objectStore(this.name)
        let request = store.delete(key)
        this.trigger("delete",key)
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(key)
            request.onerror = () => reject(request.error)
        })
    }
    get(key){
        return new Promise( async(resolve) => {
            let value = await this.getLocally(key)
            if(value){
                resolve(value)
            }
            else {
                this.dispatch({get: key})
                let handler = this.on("post",post => {
                    post.key == key && resolve(post.post)
                    this.off("post",handler)
                })
            }
        })
    }
    getLocally(key){
        this.scheme.beforeGet && this.scheme.beforeGet(key)
        let store = this.#db.transaction(this.name,"readwrite").objectStore(this.name)
        let request = store.get(key)
        return new Promise((resolve, reject) => {
            request.onsuccess = event => {
                resolve(event.target.result)
            }
            request.onerror = () => reject(request.error)
        })
    }
    getAll(){
        this.scheme.beforeGetAll && this.scheme.beforeGetAll()
        let store = this.#db.transaction(this.name,"readwrite").objectStore(this.name)
        let request = store.getAll()
        return new Promise((resolve, reject) => {
            request.onsuccess = event => {
                this.dispatch({getAll: true})
                resolve(event.target.result)
            }
            request.onerror = () => reject(request.error)
        })
    }
	getAllLocally(){
		this.scheme.beforeGetAll && this.scheme.beforeGetAll()
        let store = this.#db.transaction(this.name,"readwrite").objectStore(this.name)
        let request = store.getAll()
        return new Promise((resolve, reject) => {
            request.onsuccess = event => {
                resolve(event.target.result)
            }
            request.onerror = () => reject(request.error)
        })
	}
    count(key){
        let store = this.#db.transaction(this.name,"readwrite").objectStore(this.name)
        return new Promise( resolve => store.count(key).onsuccess = event => resolve(event.target.result))
    }
    async has(key){
        return await this.count(key) > 0
    }
    async sync(){
        let ctx = this
        this.peer.on("connection", connection => {
            if(this.peer.connections[connection.peer].length>=3) return
            console.log("New peer")
            let answer = this.peer.connect(connection.peer)
            connection.on("data", async(data) => {
                console.log("Data:", data)
                if(data.getAll) {
                    let s = await ctx.getAllLocally()
                    this.dispatch({ postAll: s })
                }
                if(data.get) {
                    let s = await ctx.getLocally(data.get)
                    answer.send({post: s, key: data.get})
                }
                if(data.post){
                    try {
                        this.addLocally(data.post)
                        this.trigger("post",data.post)
                    }
                    catch(e){}
                }
                if(data.postAll) {
                    for(let entry of data.postAll){
                        try {
                            this.addLocally(entry)
                            this.trigger("post",data.post)
                        }
                        catch(e){}
                    }
                }
                if(data.add) {
                    try {
                        this.addLocally(data.add)
                    }
                    catch(e){}
                }
				if(data.put) {
                    try {
                        this.putLocally(data.put)
                    }
                    catch(e){}
                }
				if(data.delete){
					try {
                        this.deleteLocally(data.delete)
                    }
                    catch(e){}
				}
            })
        })
        this.peer.listAllPeers(list => {
            console.log("Peers:", list)
            if(!list) return 
            for(let id of list){
                if(id != this.peer.id) {
                    this.peer.connect(id)
                }
            }
        })
    }
    dispatch(data){
        for(let p in this.peer.connections) {
            if(this.peer.connections[p]){
                for(let i in this.peer.connections[p]) this.peer.connections[p][i].send(data)
            }
        }
    }
}