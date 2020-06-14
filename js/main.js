let {Tabs, Button, FloatingActionButton, RoundIconButton, FlatButton, FileInput, ModalPanel, MaterialBox, Collection,TextInput} = materialized

class Router{
	#current = ""
	constructor(routes){
		this.routes = routes
		this.current = location.hash || routes.default
		window.onhashchange = () => this.current = location.hash
	}
	set current(v){
		console.log(v,this.routes[v])
		this.#current = this.routes[v]
		m.redraw()
	}
	get current(){
		return this.#current
	}
}

Preloader = {
    view: (vnode) =>
        m('.preloader-wrapper',{class:vnode.attrs.active?'active':''},[
            m('.spinner-layer.spinner-teal-only',[
                m('.circle-clipper.left',[
                    m('.circle')
                ]),
                m('.gap-patch',[
                    m('.circle')
                ]),
                m('.circle-clipper.right',[
                    m('.circle')
                ])
            ])
        ])
}

MasonryState = {
    contents: [],
    visible: true,
    add: (hash,file,src,tags) => {
		if(file.constructor != File) return
		if(MasonryState.contents.find(e => e.hash == hash)) return true
        MasonryState.contents.push({hash, file, src, tags})
		m.redraw()
    },
	remove(hash){
		MasonryState.contents = MasonryState.contents.filter(e => e.hash != hash)
		m.redraw()
	}
}

Masonry = {
    view: () =>
        m('.masonry',{
            style:{display: MasonryState.visible?'block':'none'},
        },
            MasonryState.contents.map(({hash,file,tags,src}) => m(MasonryItem,m('img',{
				src: src,
				onclick: () => {
					ContentModalState.src = src
					ContentModalState.file = file
					ContentModalState.tags = tags
					ContentModalState.hash = hash
					/*M.Chips.init(document.getElementById('contentTags'),{
						data: tags, 
						placeholder: 'Tag me', 
						secondaryPlaceholder: '+Tag',
						onChipAdd: el => ContentModalState.tags = el[0].M_Chips.chipsData,
						onChipDelete: el => ContentModalState.tags = el[0].M_Chips.chipsData
					})*/
					m.redraw()
				}
			})))//.concat(new Array(10).map(() => m('.masonry-item.dynamic','  ')))
        )
}

MasonryItem = {
    view: (vnode) =>
		m('a.masonry-item.box.dynamic.modal-trigger[href=#contentModal]',vnode.attrs,[
			m('.masonry-content',vnode.children)
		])
}
SearchTags = []
Board = {
    view: () =>
        m('#board',[
            m('.card',
				m(Chips,{
					id:'search',
					placeholder: ' Search with tags',
					data: SearchTags,
					secondaryPlaceholder: '+Tag',
					autocomplete: {...Nullate(TagRegister.tags),favorites: null},
					onchange: async(data) => {
						SearchTags = data
						let r = await main.search(data)
						console.log(r)
						if(!r.length && data.map(e => e.tag).excludes('favorites')){
							MasonryState.contents = []
							page = 0
							main.getPageLocally(page,pageSize)
							m.redraw()
						}
						if(data.map(e => e.tag).includes('favorites')){
							MasonryState.contents = []
							page = 0
							main.getPageLocally(page,pageSize,r)
							m.redraw()
						}
						for(let i of r){
							i.src = await FilePeruse(i.file)
						}
						MasonryState.contents = r
						m.redraw()
					}
				})
			),
            m('.center-align',{style:{position:'absolute',top:screen.height/2,left:screen.width/(window.innerWidth > 600? 2.1 : 2.3)}}, m(Preloader,{active:isLoading})),
            m('.fixed-action-btn',
				m(RoundIconButton,{
					className: 'teal',
					modalId: 'addContent',
					iconName: 'add'
				})
			),
			addContentModal(),
			m(Modal,{
				id: 'contentModal',
				content:[
					m(MaterialBox,{src: ContentModalState.src, width: window.innerWidth > 600 ? '35%' : "95%"}),
					m(Chips,{
						id: 'contentTags',
						data: ContentModalState.tags,
						onchange: data => {
							ContentModalState.tags = data
						}
					}),
					m('.right-align',[
						m('i.material-icons.reversed.text-hoverable',{ onclick: () =>
							ContentModalState.hated
							?
							(BlacklistHashs.remove(ContentModalState.hash), ContentModalState.hated = false)
							:
							(BlacklistHashs.add(ContentModalState.hash), ContentModalState.hated = true, ContentModalState.liked = false)
						},ContentModalState.hated?'favorite':'favorite_border'),
						m('i.material-icons.text-hoverable',{ onclick: () =>
							ContentModalState.liked
							?
							(Favorites.remove(ContentModalState.hash), ContentModalState.liked = false)
							:
							(Favorites.add(ContentModalState.hash), ContentModalState.liked = true, ContentModalState.hated = false)
						},ContentModalState.liked?'favorite':'favorite_border')
					])
				],
				onclose: async() => {
					let d = ContentModalState.tags.map(e => e.tag)
					for(let [from,to] of FollowTagsState.contents) {
						from.every(e => d.includes(e.tag)) && to.map(e => !d.includes(e.tag) && ContentModalState.tags.push(e))
					}
					ContentModalState.tags = ContentModalState.tags.sort((a,b) => {
								if(a.tag > b.tag) return 1
								if(a.tag < b.tag) return -1
								return 0
							})
					main.dispatch({setTags:{hash: ContentModalState.hash, tags: ContentModalState.tags}})
					let value = await main.getLocally(ContentModalState.hash)
                    value.tags = ContentModalState.tags
                    await main.putLocally(value)
					ContentModalState.tags = []
					ContentModalState.prevTags = []
					if(ContentModalState.hated){
						main.deleteLocally(ContentModalState.hash)
						MasonryState.remove(ContentModalState.hash)
					}
					ContentModalState.liked = false
					ContentModalState.hated = false
					m.redraw()
				},
				onopen: () => {
					ContentModalState.prevTags = ContentModalState.tags.map(e => e.tag)
					ContentModalState.liked = Favorites.has(ContentModalState.hash)
					ContentModalState.hated = BlacklistHashs.has(ContentModalState.hash)
					//document.getElementById('contentModal').style.width = '80%'
					//document.getElementById('contentModal').style.height = '100%'
				}
			}),
            m(Masonry),
			m('#scroll.center','   ')
        ])
}

Chips = {
	view: vnode => 
		m('.chips',{id:vnode.attrs.id,class:vnode.attrs.class}),
	onupdate(vnode){
		M.Chips.init(vnode.dom,{
			data: vnode.attrs.data?vnode.attrs.data:[], 
			placeholder: vnode.attrs.placeholder, 
			secondaryPlaceholder: vnode.attrs.secondaryPlaceholder,
			autocompleteOptions: {
				data: vnode.attrs.autocomplete
			},
			onChipAdd: el => {
				vnode.attrs.onchange(el[0].M_Chips.chipsData)
				//m.redraw()
			},
			onChipDelete: el => {
				vnode.attrs.onchange(el[0].M_Chips.chipsData)
				//m.redraw()
			},
		})
	},
	oncreate(vnode){
		M.Chips.init(vnode.dom,{
			data: vnode.attrs.data?vnode.attrs.data:[], 
			placeholder: vnode.attrs.placeholder, 
			secondaryPlaceholder: vnode.attrs.secondaryPlaceholder,
			autocompleteOptions: {
				data: vnode.attrs.autocomplete
			},
			onChipAdd: el => {
				vnode.attrs.onchange(el[0].M_Chips.chipsData)
			},
			onChipDelete: el => vnode.attrs.onchange(el[0].M_Chips.chipsData),
		})
	}
}

Modal = {
    view: (vnode) =>
        m('.modal',{id:vnode.attrs.id},[
            m('.modal-content',vnode.attrs.content),
            vnode.attrs.footer?m('.modal-footer',vnode.attrs.footer):''
		]),
	oncreate(vnode){
		M.Modal.init(vnode.dom, {
			onCloseEnd: vnode.attrs.onclose,
			onOpenStart: vnode.attrs.onopen,
			preventScroll: true
		})
	}
}

UploadState = {
	file: {},
	tags: []
}

addContentModal = () => m(Modal,{
    id:'addContent',
    content: [
        m(FileInput,{
			id:'file',
			placeholder:'Upload file',
			accept: ['image/*'],
			onchange: ([file]) => UploadState.file = file
		}),
        m(Chips,{
			id:'tags',
			placeholder: 'Add a tag',
			secondaryPlaceholder: '+Tag',
			data: UploadState.tags,
			onchange: data => {
				console.log('Data',data)
				UploadState.tags = data
			}
		})
    ],
    footer:[
        m('.btn-flat.modal-close',{
            onclick: () => {
				let fr = new FileReader()
				fr.readAsDataURL(UploadState.file)
				fr.onload = async() => {
					let sorted = UploadState.tags.sort((a,b) => {
						if(a.tag > b.tag) return 1
						if(a.tag < b.tag) return -1
						return 0
					})
					await main.add({hash: md5(fr.result),tags: sorted, file:UploadState.file})
					UploadState.tags = []
				}
            }
        },'Upload')
    ]
})

ContentModalState = {
	src: "",
	hash: "",
    tags: []
}


Tags = {
	view: () =>
		m('.card-panel',[
			m('h6.card-title',{style: 'font-family: monospace; font-weight: bold;'},'Теги'),
			m('table',
				Object.entries(TagRegister.tags).map(([i,e]) => m('tr',m('td',i),m('td',e)))
			)
		]),
	onupdate(){
		//main.getAllTags()
	}
}

BlackList = {
	view: () => 
		m('.card-panel',[
			m('h6.card-title',{style: 'font-family: monospace; font-weight: bold;'},'Скрываемые теги'),
			m(Chips,{
				placeholder: BlacklistTags.contents.length ? 'Негодные теги' : '',
				data: BlacklistTags.contents.map(e => ({tag: e})),
				onchange: data => {
					BlacklistTags.set(data.map(e => e.tag))
					BlacklistTags.accept = true
					m.redraw()
				}
			}),
			m('.right-align', m(FlatButton,{label: "Принять", class: BlacklistTags.accept ? undefined : "disabled", onclick: () => {
				BlacklistTags.accept = false
				main.deleteWithTags(BlacklistTags.contents)
			}}))
		])
}

MapEditor = {
	view: vnode =>
		m('table', [
			...Object.entries(FollowTagsState.contents).map(([index,[i,e]]) => 
				m('tr',
					m('td',
						m(Chips,{data: i, onchange: data => {
							if(!data.length){
								FollowTagsState.contents.splice(index)
								return
							}
							FollowTagsState.contents[index] = [data,e]
							FollowTagsState.save()
							m.redraw()
						}})
					),
					m('td',
						m(Chips,{data: e,  onchange: data => {
							if(!data.length){
								FollowTagsState.contents.splice(index)
								return
							}
							FollowTagsState.contents[index] = [i,data]
							FollowTagsState.save()
							m.redraw()
						}})
					)
				)
			),
			m('tr',
					m('td',
						m(FlatButton,{
							iconName: 'add',
							onclick: () => FollowTagsState.contents.push([[],[]])
						})
					)
			)
		])
}

FollowTags = {
	view: () =>
		m('.card',
			m(MapEditor)
		)
}

About = {
    view: () =>
        m('.card','About')
}


router = new Router({
	'#board': Board,
	'#tags' : Tags,
	'#blacklist': BlackList,
	'#follow_tags': FollowTags,
	'#about': About,
	default: '#board'
})

Nav = {
	view: () =>
		m('.navbar-fixed',
            m('nav.nav-wrapper', {class: 'grey lighten-5',style:'user-select:none;'}, [
                m('a.brand-logo', {href: '#!'},m('img#logo',{src: 'logo.png',height: 55,style: {marginLeft: 10,marginTop: 2}})),
				m('span.brand-name.hide-on-med-and-down',{style: 'font-family: Roboto Mono, monospace; font-size: 1.5em;position: fixed; left: 5%; color: black;'},'opichan'),
                m('a.sidenav-trigger', {'data-target': "mobile-sidebar"}, m('i.material-icons.black-text','menu')),
                m('ul.right.hide-on-med-and-down', [
                    m('li', m('a.black-text.sidenav-close', {href: '#board'}, 'Доска')),
					m('li', m('a.black-text.sidenav-close', {onclick: async() => {
						SearchTags = [{tag:'favorites'}];
						let r = await main.search(SearchTags)
						MasonryState.contents = []
						page = 0
						main.getPageLocally(page,pageSize,r)
						m.redraw()
				}}, 'Любимое')),
					m('li', m('a.black-text.sidenav-close', {href: '#tags' }, 'Теги')),
					m('li', m('a.black-text.sidenav-close', {href: '#blacklist' }, 'Скрываемые теги')),
					m('li', m('a.black-text.sidenav-close', {href: '#follow_tags' }, 'Сопутствующие теги')),
                    m('li', m('a.black-text.sidenav-close', {href: '#about'}, 'О Kopichan'))
                ]),
            ])
		),
	oncreate: () => {
		M.AutoInit()
	}
}

App = {
	rerender: () => {
		m.redraw()
		M.AutoInit()
	},
    view: () =>
        m('#app', [
			m(Nav),
			m('ul.sidenav#mobile-sidebar', [
                m('li', m('a.black-text.sidenav-close', {href: '#board'}, 'Доска')),
				m('li', m('a.black-text.sidenav-close', {onclick: async()=> {
					SearchTags = [{tag:'favorites'}];
					let r = await main.search(SearchTags)
					MasonryState.contents = []
					page = 0
					main.getPageLocally(page,pageSize,r)
					m.redraw()
				}}, 'Любимое')),
				m('li', m('a.black-text.sidenav-close', {href: '#tags' }, 'Теги')),
				m('li', m('a.black-text.sidenav-close', {href: '#blacklist' }, 'Скрываемые теги')),
                m('li', m('a.black-text.sidenav-close', {href: '#about'}, 'О Kopichan'))
            ]),
            m('main',m(router.current))
        ])
}


isInViewport = function(elem) {
	if(!elem) return
    var bounding = elem.getBoundingClientRect();
    return (
        bounding.top >= 0 &&
        bounding.left >= 0 &&
        Math.floor(bounding.bottom) <= (window.innerHeight || document.documentElement.clientHeight) &&
        Math.floor(bounding.right) <= (window.innerWidth || document.documentElement.clientWidth)
    );
};

m.mount(document.body,App)

document.onscroll = async function(){
	if(isInViewport(document.getElementById('scroll'))) {
		if(await main.count() >= page*pageSize){
			page++
			main.getPageLocally(page,pageSize,MasonryState.contents.length-1)
		}
	}
}

document.querySelector('.drag-target').style = 'z-index:999;width:20px'

function deepEqual(obj1,obj2){
	if(typeof obj1 == 'object' && typeof obj2 == 'object') {
		if(obj1.length && obj2.length) return obj1.length == obj2.length
		for(let i in obj1){
			if(deepEqual(obj1[i],obj2[i])){
				return true
			}
		}
	}
	else {
		return obj1 == obj2
	}
}
function Nullate(obj1){
	obj2 = {}
	for(let i in obj1){
		obj2[i] = null
	}
	return obj2
}