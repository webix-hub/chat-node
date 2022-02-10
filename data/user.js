class User {
  constructor(dao, scheme, config) {
    this._dao = dao;
    this._scheme = scheme;
  }

  async getOne(id) {
    return this._scheme.User.findByPk(id);
  }

  async getAll() {
    return this._scheme.User.findAll();
  }

  async getGroupName(uids) {
    const users = await this._scheme.User.findAll({
      where: {
        id: uids,
      },
    });

    return users.map((a) => a.name).join(", ");
  }

  async changeOnlineStatus(id, status) {
    return this._scheme.User.update(
      {
        status: status,
      },
      {
        where: { id },
      }
    );
  }
}

module.exports = User;
