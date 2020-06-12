let {Tabs, Button, FloatingActionButton, RoundIconButton, FlatButton, FileInput, ModalPanel, MaterialBox, Collection} = materialized

class Router{
	#current = ""
	constructor(routes,current){
		this.routes = routes
		this.#current = routes[current]
	}
	set current(v){
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
						onchange: data => ContentModalState.tags = data.sort((a,b) => {
							if(a.tag > b.tag) return 1
							if(a.tag < b.tag) return -1
							return 0
						})
					}),
					m('.right-align',m(FlatButton,{iconName: ContentModalState.liked?'favorite':'favorite_border', onclick: () =>
						ContentModalState.liked
						?
						(Favorites.remove(ContentModalState.hash),ContentModalState.liked = false)
						:
						(Favorites.add(ContentModalState.hash),ContentModalState.liked = true)
						}))
				],
				onclose: async() => {
					main.dispatch({setTags:{hash: ContentModalState.hash, tags: ContentModalState.tags}})
					let value = await main.getLocally(ContentModalState.hash)
                    value.tags = ContentModalState.tags
                    await main.putLocally(value)
					ContentModalState.tags = []
					ContentModalState.prevTags = []
					m.redraw()
				},
				onopen: () => {
					ContentModalState.prevTags = ContentModalState.tags.map(e => e.tag)
					ContentModalState.liked = Favorites.has(ContentModalState.hash)
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
			},
			onChipDelete: el => vnode.attrs.onchange(el[0].M_Chips.chipsData),
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
					m.redraw()
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
		m('.card',[
			m('h5','Теги'),
			m('table',
				Object.entries(TagRegister.tags).map(([i,e]) => m('tr',m('td',i),m('td',e)))
			)
		]),
	onupdate(){
		//main.getAllTags()
	}
}

About = {
    view: () =>
        m('.card','About')
}


router = new Router({
	'#board': Board,
	'#tags' : Tags,
	'#about': About
})

router.current = '#board'

Nav = {
	view: () =>
		m('.navbar-fixed',
            m('nav.nav-wrapper', {class: 'grey lighten-5',style:'user-select:none;'}, [
                m('a.brand-logo', {href: '#!'},m('img#logo',{src: 'logo.png',height: 55,style: {marginLeft: 10,marginTop: 2}})),
                m('a.sidenav-trigger', {'data-target': "mobile-sidebar"}, m('i.material-icons.black-text','menu')),
                m('ul.right.hide-on-med-and-down', [
                    m('li', m('a.black-text.sidenav-close', {href: '#board', onclick: ()=> router.current = '#board'}, 'Доска')),
					m('li', m('a.black-text.sidenav-close', {href: '#favs' , onclick: async()=> {
						SearchTags = [{tag:'favorites'}];
						let r = await main.search(SearchTags)
						MasonryState.contents = []
						page = 0
						main.getPageLocally(page,pageSize,r)
						m.redraw()
				}}, 'Любимое')),
					m('li', m('a.black-text.sidenav-close', {href: '#tags' , onclick: ()=> router.current = '#tags' }, 'Теги')),
                    m('li', m('a.black-text.sidenav-close', {href: '#about', onclick: ()=> router.current = '#about'}, 'О Kopichan'))
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
                m('li', m('a.black-text.sidenav-close', {href: '#board', onclick: ()=> router.current = '#board'}, 'Доска')),
				m('li', m('a.black-text.sidenav-close', {href: '#favs' , onclick: async()=> {
					SearchTags = [{tag:'favorites'}];
					let r = await main.search(SearchTags)
					MasonryState.contents = []
					page = 0
					main.getPageLocally(page,pageSize,r)
					m.redraw()
				}}, 'Любимое')),
				m('li', m('a.black-text.sidenav-close', {href: '#tags' , onclick: ()=> router.current = '#tags' }, 'Теги')),
                m('li', m('a.black-text.sidenav-close', {href: '#about', onclick: ()=> router.current = '#about'}, 'О Kopichan'))
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