import * as gcloud from "gcloud";
import * as Promise from "bluebird";
import { IDataContext, IDataStore, StorageEntity } from "./storageEntity";
import { Entity, PropertyType, ValueProperty, PropertyDescriptor, EntityClass, EntityProperty, PrimaryKeyProperty } from "./entity";
import { CloudStoreEntity } from "./cloudStoreEntity";
import { CloudEntityHelpers } from "./cloudEntityHelpers";
import * as lodash from "lodash";

export class CloudDataStore implements IDataStore {
    private store: GCloud.Datastore.IDatastore;

    public constructor(projectId: string) {
        this.store = gcloud.datastore({ projectId: projectId });
    }

    public validate(entity: StorageEntity): void {
        var cEntity = <CloudStoreEntity>entity;
        var len = entity.getPrimaryKeys().length;
        if (len != 1) {
            throw `Entity should have only one primary key. But contains ${len}.`;
        }

        if (!cEntity.kind) {
            throw `Entity should have 'kind' property.`;
        }
    }

    public del(entity: StorageEntity): Promise<boolean> {
        var cEntity = <CloudStoreEntity>entity;
        var delPromise = Promise.promisify(this.store.delete, { context: this.store });
        var key = this.store.key([cEntity.kind, cEntity.getKey()]);
        return delPromise(key)
            .catch(err => {
                throw this.convertError(err);
            });
    }

    public get(entity: StorageEntity): Promise<boolean> {
        var cEntity = <CloudStoreEntity>entity;
        var getPromise = Promise.promisify(this.store.get, { context: this.store });
        var key = this.store.key([cEntity.kind, cEntity.getKey()]);
        return getPromise(key)
            .then((v: any) => {
                if (!v) {
                    return false;
                }
                
                var obj = v.data;
                for (var key in obj) {
                    if (!obj.hasOwnProperty(key)) {
                        throw `load():Entity(${cEntity.kind}) doesn't have property ${key}.`;
                    }

                    var descriptor = entity.getPropertyDescriptor(key);
                    if (descriptor) {
                        if (descriptor.type === PropertyType.PRIMARY ||
                            descriptor.type === PropertyType.VALUE) {

                            cEntity.setPropertyValue(descriptor.name, obj[key]);
                        } else if (descriptor.type === PropertyType.REFERENCE) {
                            var refEntity: CloudStoreEntity = new descriptor.referenceType();
                            refEntity.setKey(obj[key]);
                        }
                    }
                }

                cEntity.resetState();
                return true;
            })
            .catch(err => {
                throw this.convertError(err);
            });;
    }

    public insert(entity: StorageEntity): Promise<void> {
        return this.doInsert(entity, false);
    }

    public save(entity: StorageEntity): Promise<void> {
        return this.doInsert(entity, true);
    }

    public query<T>(type: { new (): T }, query: string): Promise<any[]> {
        return new Promise<any[]>((resolve, reject) => {
            resolve([]);
        });
    }

    private doInsert(entity: StorageEntity, overwrite: boolean): Promise<any> {
        var cEntity = <CloudStoreEntity>entity;
        var id = cEntity.getKey();
        var key = this.store.key(id ? [cEntity.kind, id] : cEntity.kind);
        var keyStr = JSON.stringify(key);
        var insertPromise = Promise.promisify(overwrite ? this.store.upsert : this.store.insert,
            { context: this.store });
        return insertPromise({ key: key, data: CloudEntityHelpers.getStorageObject(cEntity) })
            .catch(err => { throw this.convertError(err); });;
    }

    private convertError(err: any): CommonTypes.PromiseError {

        if (lodash.isString(err)) {
            return err;
        }

        return {
            message: err.message,
            code: err.code,
            stack: err.stack
        };
    }
}
