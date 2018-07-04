import * as React from 'react'
import * as ApiMeta from '../../utils/ApiMeta';
import * as Meta from '../../utils/Metadata';

function DefailtDescription(Type:string,DocTitle:string,Target:string)
{
        switch (Type)
        {
            case 'EntityDetail':
                return `在**${DocTitle}**中罗列${Target}的所有属性，可以查看具体属性信息。`;
            case 'EntityEdit':
                //，在删除操作时，系统会检查当前{Target}是否正在使用，不能删除使用中的{Target},但可以将其标记为无效或逻辑删除,逻辑删除的{Target}不会在列表画面中默认显示。
                return `在**${DocTitle}**中可以新建${Target},修改${Target}的属性，以及删除{Target}。`;
            case 'EntityList':
                return `**${DocTitle}**可以查看所有${Target},可以选择具体${Target}查看具体信息。`;
            case 'EntityQuery':
                return `**${DocTitle}**可以查询相关的${Target},通过选择不同筛选条件,可以按照不同组合条件进行查询。`;
            case 'EntityManager':
                return `**${DocTitle}**可以管理相关${Target},新增${Target},以及通过条件查询${Target}等。`;
            default:
                return "";
        }

}
export interface EntityHelpProps {
    entity: string;
}

export class EntityDetailHelp extends React.Component<EntityHelpProps, {}>
{
    constructor(props: EntityHelpProps) {
        super(props);
    }

    render() {
        var lib=ApiMeta.defaultLibrary();
        var svc=lib.getEntityController(this.props.entity);
        if(!svc)
            return <h2>找不到指定的实体</h2>
        var method=svc.Methods.filter(m=>m.Name=="LoadForEdit")[0];
        if(!method)
            method=svc.Methods.filter(m=>m.Name=="Get")[0];
        if(!method)
            return <h2>找不到实体的查询方法</h2>
        var type=lib.type(method.Type);
        if(!type)
            return <h2>找不到指定的实体类型:{method.Type}</h2>

        return <div>
            <h2>{svc.Title}的详细内容</h2>
            <p>{svc.Title}详细内容中罗列了{svc.Title}的所有属性，您可以查看具体属性信息。</p>
            <table>
                <tr>
                    <td>#</td>
                    <td>属性</td>
                    <td>说明</td>
                    <td>备注</td>
                </tr>
            {
               lib.allTypeProperties(type).map((p,i)=>
                <tr>
                    <td>{i+1}</td>
                    <td>{p.Title}</td>
                    <td>{p.Description}</td>
                    <td></td>
                </tr>
                )

            }
            </table>
            
            
            </div>
    }
}

export class EntityManagerHelp extends React.Component<EntityHelpProps, {}>
{

    constructor(props: EntityHelpProps) {
        super(props);
    }

    render() {
        var lib=ApiMeta.defaultLibrary();
        var svc=lib.getEntityController(this.props.entity);
        if(!svc)
            return <h2>找不到指定的实体</h2>
        var method=svc.Methods.filter(m=>m.Name=="LoadForEdit")[0];
        if(!method)
            method=svc.Methods.filter(m=>m.Name=="Get")[0];
        if(!method)
            return <h2>找不到实体的查询方法</h2>
        var type=lib.type(method.Type);
        if(!type)
            return <h2>找不到指定的实体类型:{method.Type}</h2>

        return <div>
            <h2>{svc.Title}的详细内容</h2>
            <p>{svc.Title}详细内容中罗列了{svc.Title}的所有属性，您可以查看具体属性信息。</p>
            <table>
                <tr>
                    <td>#</td>
                    <td>属性</td>
                    <td>说明</td>
                    <td>备注</td>
                </tr>
            {
               lib.allTypeProperties(type).map((p,i)=>
                <tr>
                    <td>{i+1}</td>
                    <td>{p.Title}</td>
                    <td>{p.Description}</td>
                    <td></td>
                </tr>
                )

            }
            </table>
            
            
            </div>
    }
}

export class EntityHelpContainer extends React.Component<EntityHelpProps, {}>
{
    constructor(props: EntityHelpProps) {
        super(props);
    }

    render() {
      
        return <div>
            <EntityManagerHelp entity={this.props.entity}/>
            
            </div>
    }

}
