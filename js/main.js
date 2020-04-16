Board = {
    view: () =>
        m('#board',[
            m('.card', m('.chips#search')),
            m('.center-align',{style:{position:'absolute',top:screen.height/2,left:screen.width/2.3}}, m(Preloader,{active:isLoading})),
            m('.fixed-action-btn',m('a.btn-floating.btn-large.teal.modal-trigger',{href:'#addContent'},m('i.material-icons.large.white-text','add'))),
            m(Masonry),
            m(Modal,{
                id:'addContent',
                content: [
                    m(FileInput),
                    m('.chips#tags')
                ],
                footer:[
                    m('.btn-flat.modal-close','Upload')
                ]
            })
        ]),
    oncreate() {
        chipsInit()
    }
}
isLoading = false
function Search(string){
    console.log(string)
}
function debug(value){
    console.log(value)
    return value
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
FileInput = {
    view: () =>
        m('.file-field.input-field',[
            m('.btn',[
                'File',
                m('input[type=file]')
            ]),
            m('.file-path-wrapper',[
                m('input.file-path.validate[type=text]')
            ])
        ])
}
Modal = {
    view: (vnode) =>
        m('.modal',{id:vnode.attrs.id},[
            m('.modal-content',vnode.attrs.content),
            vnode.attrs.footer?m('.modal-footer',vnode.attrs.footer):''
        ])
}
About = {
    view: ()=>
        m('.card','About')
}
Routes = {
    '#board': Board,
    '#about': About
}
Route = Routes['#board']
changeRoute = route => {
    Route = Routes[route];
    m.redraw()
}
chipsInit = () =>
    M.Chips.init(document.querySelector('#search'),{
    placeholder:'Enter Tag',
    secondaryPlaceholder:'+Tag',
    onChipAdd: () => {
        document.querySelectorAll('.chip').forEach(el => el.innerText.includes('not:') && (el.style='background-color:#e57373'))
        isLoading = true
        MasonryState.visible = false
        m.redraw()
        setTimeout(()=>{isLoading = false; MasonryState.visible = true; m.redraw()},1000)
    }
})
MasonryState = {
    contents: ['tests/1.png','tests/2.png','tests/3.png','tests/4.png','tests/5.png'],
    visible: true,
    add: (image) => {
        //let image = await new FileReader().readAsDataURL(file)
        MasonryState.contents.push(image)
        m.redraw()
    }
}
Masonry = {
    view: () =>
        m('.masonry',{
            style:{display: MasonryState.visible?'block':'none'}
        },
            MasonryState.contents.map(image => m(MasonryItem,m('img',{src:image})))
        )
}
MasonryItem = {
    view: (vnode) =>
    m('.masonry-item.box.dynamic',[
        m('.masonry-content',vnode.children)
    ])
}
App = {
    rerender: () => {m.redraw();M.AutoInit()},
    view: () =>
        m('#app', [
            m('.navbar-fixed',
            m('nav.nav-wrapper', {class: 'grey lighten-5',style:'user-select:none;'}, [
                m('a.brand-logo', {href: '#!'},m('img#logo',{src: 'logo.png',height: 55,style: {marginLeft: 10,marginTop: 2}})),
                m('a.sidenav-trigger', {'data-target': "mobile-sidebar"}, m('i.material-icons.black-text','menu')),
                m('ul.right.hide-on-med-and-down', [
                    m('li',m('a.black-text.sidenav-close',{href: '#board',onclick: ()=>changeRoute('#board')},'Доска')),
                    m('li',m('a.black-text.sidenav-close',{href: '#about',onclick:()=>changeRoute('#about')},'О Kopichan'))
                ]),
            ])),
            m('ul.sidenav#mobile-sidebar', [
                m('li',m('a.black-text.sidenav-close',{href: '#board',onclick: ()=>changeRoute('#board')},'Доска')),
                m('li',m('a.black-text.sidenav-close',{href: '#about',onclick:()=>changeRoute('#about')},'О Kopichan'))
            ]),
            m('main',m(Route))
        ])
}
m.mount(document.body,App)
M.AutoInit()
chipsInit()
document.querySelector('.drag-target').style = 'z-index:999;width:20px'