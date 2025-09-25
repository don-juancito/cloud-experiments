# frozen_string_literal: true

require 'sinatra'
require 'json'

set :port, 4567
set :bind, '0.0.0.0'

POKE_DATA = JSON.load File.open 'pokedata.json'

before do
  content_type :json
end

get '/' do
  {
    data: {status: 'All Good'},
    source: ENV['HOSTNAME']
  }
end

get '/poke_info' do
  {
    data: POKE_DATA,
    source: ENV['HOSTNAME']
  }
end

get '/poke_info/:dex_number' do
  {
    data: POKE_DATA[params[:dex_number]],
    source: ENV['HOSTNAME']
  }
end

after do
  response.body = JSON.dump(response.body)
end