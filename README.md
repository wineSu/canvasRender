<h1 align="center">canvasEngine</h1>

<p>
    通过自定义标签+style+canvas 实现一款渲染器，也可以理解为一个超级超级简单的“浏览器”
    主要目的是为了绘制并渲染一套可交互式的 ui
</p>

    方式1:
        <template id="temp-head">
            <style type="text/css">
                .head{
                background: #00739C;
                color: #fff;
            }
            </style>
            <Test class="head">head11</Test>
        </template>
        利用浏览器自带模板功能，标签放在 body 内

    方式2:
        const App = {
            template: `<Test class="head">head11</Test>`,
            style: {xxx:xxx},
            setup: {
                // 一些钩子加入，完善渲染体系
            }
        }
        此方式的使用方式和 vue 类似

    方式3:
      class App {
        render() {
            return <Test class="head">head11</Test>
        }
      }
      此方式的使用方式和 react 类似。

    方式4:
      自定义 xml、样式、逻辑，类似小程序做法

    更多：
      利用 react、vue（这个框架有自定义渲染器能力） 现有框架能力，得到虚拟 dom，进行 canvas 渲染引擎开发绘制（类似现有的 RN 跨端做法），
      或者纯 api 式调用，类似 zrender。

    如上的几种方式都离不开编译这一步（Test 标签到 js 语言转换），无论如何使用其本质都是一样的，开发过程将 api 到语义化过渡，运行时又要反转此过程：语义化 --> api化。
    甚至以上四种方式之间也可以相互编译，其中方式3和4需要增加一层本地脚本构建过程，并且可以选择其他语言实现，这里为了方便直接接入 canvas api，使用 js 进行实现渲染引擎。
    为了更好的模拟 web 化，优先选择方式1来进行实现标签编写，无论选择哪种方式，都是为了最后拿到模板内容进行 parser 并编译为想要的一种中间数据格式，
    我们要实现的是渲染器（类似浏览器渲染过程），重点不在于如何使用绘制 canvas 组件(比如基于 react、vue 封装自己的 canvas 渲染标签)，而是如何实现一个“渲染引擎”的完整流程。

    关键知识点：编译、渲染树、布局树、排版引擎、cssdom、canvas、ui操作api。

    TODO: 
     1、实现过程中支持原生态组件化；
     2、接近 web api 生态，可以完全接入现有框架绘制渲染；
<img src="https://github.com/wineSu/canvasRender/blob/main/example/demo.jpg" alt="Image text" style="zoom:50%;" />
<p align = 'center'>©wineSu ©www.gitsu.cn</p>

