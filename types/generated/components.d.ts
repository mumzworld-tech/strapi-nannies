import type { Schema, Struct } from '@strapi/strapi';

export interface ContentCheckedList extends Struct.ComponentSchema {
  collectionName: 'components_content_checked_lists';
  info: {
    displayName: 'CheckedList';
  };
  attributes: {
    items: Schema.Attribute.Component<'content.list', true>;
    title: Schema.Attribute.String;
  };
}

export interface ContentCustomer extends Struct.ComponentSchema {
  collectionName: 'components_content_customers';
  info: {
    displayName: 'Customer';
  };
  attributes: {
    countryCode: Schema.Attribute.String;
    email: Schema.Attribute.Email;
    fullName: Schema.Attribute.String;
    phone: Schema.Attribute.String;
  };
}

export interface ContentGallery extends Struct.ComponentSchema {
  collectionName: 'components_content_galleries';
  info: {
    displayName: 'Gallery';
  };
  attributes: {
    file: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    position: Schema.Attribute.Integer;
    title: Schema.Attribute.String;
  };
}

export interface ContentList extends Struct.ComponentSchema {
  collectionName: 'components_content_lists';
  info: {
    displayName: 'List';
  };
  attributes: {
    label: Schema.Attribute.String;
  };
}

export interface ContentLocation extends Struct.ComponentSchema {
  collectionName: 'components_content_locations';
  info: {
    displayName: 'Location';
  };
  attributes: {
    address: Schema.Attribute.Text;
    area: Schema.Attribute.String;
    city: Schema.Attribute.String;
    country: Schema.Attribute.Enumeration<['United Arab Emirates']>;
  };
}

export interface ContentOverview extends Struct.ComponentSchema {
  collectionName: 'components_content_overviews';
  info: {
    displayName: 'Overview';
  };
  attributes: {
    description: Schema.Attribute.Text;
    title: Schema.Attribute.String;
  };
}

export interface ContentPackageGroup extends Struct.ComponentSchema {
  collectionName: 'components_content_package_groups';
  info: {
    displayName: 'PackageGroup';
  };
  attributes: {
    items: Schema.Attribute.Component<'content.package-group-item', true>;
    noOfDays: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          max: 7;
          min: 1;
        },
        number
      > &
      Schema.Attribute.DefaultTo<1>;
  };
}

export interface ContentPackageGroupItem extends Struct.ComponentSchema {
  collectionName: 'components_content_package_group_items';
  info: {
    displayName: 'PackageGroupItem';
  };
  attributes: {
    hours: Schema.Attribute.Integer & Schema.Attribute.Required;
    price: Schema.Attribute.Decimal &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      >;
  };
}

export interface ContentTimeRange extends Struct.ComponentSchema {
  collectionName: 'components_content_time_ranges';
  info: {
    displayName: 'TimeRange';
  };
  attributes: {
    endTime: Schema.Attribute.String & Schema.Attribute.Required;
    startTime: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'content.checked-list': ContentCheckedList;
      'content.customer': ContentCustomer;
      'content.gallery': ContentGallery;
      'content.list': ContentList;
      'content.location': ContentLocation;
      'content.overview': ContentOverview;
      'content.package-group': ContentPackageGroup;
      'content.package-group-item': ContentPackageGroupItem;
      'content.time-range': ContentTimeRange;
    }
  }
}
