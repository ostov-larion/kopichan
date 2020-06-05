let {Tabs, Button, FloatingActionButton, RoundIconButton, FileInput, ModalPanel, MaterialBox} = materialized

class Router{
	#current = ""
	constructor(routes,current){
		this.routes = routes
		this.#current = routes[current]
	}
	set current(v){
		this.#current = this.routes[v]
		m.redraw()
		M.AutoInit()
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
    add: (hash,file,tags) => {
		if(file.constructor != String) return
        MasonryState.contents.push({hash, file, tags})
		m.redraw()
    }
}

Masonry = {
    view: () =>
        m('.masonry',{
            style:{display: MasonryState.visible?'block':'none'},
        },
            MasonryState.contents.map(({hash,file,tags}) => m(MasonryItem,m('img',{
				src: file,
				onclick: () => {
					console.log(tags)
					ContentModalState.src = file
					ContentModalState.tags = tags
					ContentModalState.hash = hash
					m.redraw()
				}
			})))
        )
}

MasonryItem = {
    view: (vnode) =>
    m('a.masonry-item.box.dynamic.modal-trigger[href=#contentModal]',vnode.attrs,[
        m('.masonry-content',vnode.children)
    ])
}

Board = {
    view: () =>
        m('#board',[
            m('.card',
				m(Chips,{
					id:'search',
					placeholder: ' Search with tags',
					secondaryPlaceholder: '+Tag'
				})
			),
            m('.center-align',{style:{position:'absolute',top:screen.height/2,left:screen.width/2.3}}, m(Preloader,{active:isLoading})),
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
					m(MaterialBox,{src: ContentModalState.src, width: innerWidth > 600 ? "30%" : "90%"}),
					m(Chips,{
						id: 'contentTags',
						data: ContentModalState.tags,
						onchange: data => ContentModalState.tags = data
					})
				],
				onclose: () => {
					main.put({hash: ContentModalState.hash, file: ContentModalState.src, tags: ContentModalState.tags})
					ContentModalState.tags = []
					m.redraw()
				}
			}),
            m(Masonry),
        ])
}

Chips = {
	view: vnode => 
		m('.chips'),
	onupdate(vnode){
		M.Chips.init(vnode.dom,{
			data: vnode.attrs.data?vnode.attrs.data:[], 
			placeholder: vnode.attrs.placeholder, 
			secondaryPlaceholder: vnode.attrs.secondaryPlaceholder,
			onChipAdd: el => {
				console.log(el)
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
			onCloseEnd: vnode.attrs.onclose
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
					console.log(UploadState.tags)
					await main.add({hash: md5(fr.result),tags: UploadState.tags, file:fr.result})
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


About = {
    view: ()=>
        m('.card','About')
}


router = new Router({
	'#board': Board,
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
                    m('li',m('a.black-text.sidenav-close',{href: '#board',onclick: ()=> router.current = '#board'},'Доска')),
                    m('li',m('a.black-text.sidenav-close',{href: '#about',onclick: ()=> router.current = '#about'},'О Kopichan'))
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
                m('li',m('a.black-text.sidenav-close',{href: '#board',onclick: ()=>router.current = '#board'},'Доска')),
                m('li',m('a.black-text.sidenav-close',{href: '#about',onclick:()=>router.current = '#about'},'О Kopichan'))
            ]),
            m('main',m(router.current))
        ])
}

m.mount(document.body,App)

document.querySelector('.drag-target').style = 'z-index:999;width:20px'